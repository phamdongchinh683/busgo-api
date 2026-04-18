import type Stripe from 'stripe'
import { stripe } from '../client/index.js'
import { dal } from '../../../database/index.js'
import { db } from '../../../datasource/db.js'
import { utils } from '../../../utils/index.js'

export async function handleWebhook(rawBody: string | Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(event.data.object)
            break
        case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object)
            break
    }

    return { received: true }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const transactionCode = paymentIntent.metadata?.transactionCode
    if (!transactionCode) return

    await db.transaction().execute(async tx => {
        const payment = await dal.payment.payment.query.getPayment(undefined, transactionCode, tx)
        if (!payment || payment.status === 'success') return

        await dal.payment.payment.cmd.updatePaymentStatusSuccess(
            transactionCode,
            paymentIntent.id,
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
