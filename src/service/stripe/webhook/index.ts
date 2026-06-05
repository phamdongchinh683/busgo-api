import type Stripe from 'stripe'
import { stripe } from '../client/index.js'
import { dal } from '../../../database/index.js'
import { db } from '../../../datasource/db.js'
import { utils } from '../../../utils/index.js'

export async function handleWebhook(rawBody: string | Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

    try {
        const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object)
                break
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object)
                break
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object)
                break
        }
    } catch (err: any) {
        if (err?.message?.includes('parseEventNotification')) {
            return { received: true }
        }
        throw err
    }

    return { received: true }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const transactionCode = paymentIntent.metadata?.transactionCode
    if (!transactionCode) return

    await updateStripePaymentSuccess(transactionCode, paymentIntent.id)
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.payment_status !== 'paid') return

    const transactionCode = session.metadata?.transactionCode
    if (!transactionCode) return

    const paymentIntentId =
        typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id

    if (!paymentIntentId) return

    await updateStripePaymentSuccess(transactionCode, paymentIntentId)
}

async function updateStripePaymentSuccess(transactionCode: string, paymentIntentId: string) {
    await db.transaction().execute(async tx => {
        const payment = await dal.payment.payment.query.getPayment(undefined, transactionCode, tx)
        if (!payment || payment.status === 'success') return

        await dal.payment.payment.cmd.updatePaymentStatusSuccess(
            transactionCode,
            paymentIntentId,
            utils.time.getNow().toISOString(),
            tx
        )
    })
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const transactionCode = paymentIntent.metadata?.transactionCode
    if (!transactionCode) return

    await db.transaction().execute(async tx => {
        const payment = await dal.payment.payment.query.getPayment(undefined, transactionCode, tx)
        if (!payment || payment.status === 'failed') return

        await dal.payment.payment.cmd.updatePaymentStatusFailed(transactionCode, tx)
    })
}
