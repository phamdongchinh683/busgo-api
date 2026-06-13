import type Stripe from 'stripe'
import { stripe } from '../client/index.js'
import { dal } from '../../../database/index.js'
import { db } from '../../../datasource/db.js'
import { utils } from '../../../utils/index.js'
import { PaymentMethod, PaymentStatus } from '../../../database/booking/booking/type.js'

const StripePaymentSuccessResult = {
    recorded: 'recorded',
    alreadyRecorded: 'already_recorded',
    refundRequired: 'refund_required',
    ignored: 'ignored',
} as const

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
                // A failed intent can be retried, and another Stripe payment flow may still be active.
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
    const result = await db.transaction().execute(async tx => {
        const currentPayment = await dal.booking.booking.query.getPayment(
            undefined,
            transactionCode,
            tx
        )
        if (!currentPayment) {
            return StripePaymentSuccessResult.ignored
        }

        await dal.booking.booking.query.lockBookingForPayment(currentPayment.id as any, tx)

        const payment = await dal.booking.booking.query.getPaymentByTransactionCodeForUpdate(
            transactionCode,
            tx
        )
        if (!payment || payment.paymentMethod !== PaymentMethod.enum.stripe) {
            return StripePaymentSuccessResult.ignored
        }

        if (
            payment.transactionNo === paymentIntentId &&
            (payment.paymentStatus === PaymentStatus.enum.success ||
                payment.paymentStatus === PaymentStatus.enum.refunded)
        ) {
            return StripePaymentSuccessResult.alreadyRecorded
        }

        if (payment.paymentStatus !== PaymentStatus.enum.pending) {
            return StripePaymentSuccessResult.refundRequired
        }

        await dal.booking.booking.cmd.updatePaymentStatusSuccess(
            transactionCode,
            paymentIntentId,
            utils.time.getNow().toISOString(),
            tx
        )
        return StripePaymentSuccessResult.recorded
    })

    if (result === StripePaymentSuccessResult.refundRequired) {
        await stripe.refunds.create(
            {
                payment_intent: paymentIntentId,
                refund_application_fee: true,
                reverse_transfer: true,
                reason: 'duplicate',
            },
            {
                idempotencyKey: `duplicate-payment-refund:${transactionCode}:${paymentIntentId}`,
            }
        )
    }
}
