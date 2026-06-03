import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ''

export const stripe = new Stripe(STRIPE_SECRET_KEY, {})

export async function createCustomer(params: {
    email?: null | string
    phone: string
    name: string
    metadata: Record<string, string>
}) {
    const { email, phone, name, metadata } = params

    return stripe.customers.create({
        email: email ?? undefined,
        phone,
        name,
        metadata,
    })
}

export async function addCard(params: { customerId: string; paymentMethodId: string }) {
    return stripe.paymentMethods.attach(params.paymentMethodId, {
        customer: params.customerId,
    })
}

export async function setDefaultPaymentMethod(params: {
    customerId: string
    paymentMethodId: string
}) {
    return stripe.customers.update(params.customerId, {
        invoice_settings: {
            default_payment_method: params.paymentMethodId,
        },
    })
}

export async function createSetupIntent(params: { customerId: string }) {
    return stripe.setupIntents.create({
        customer: params.customerId,
        payment_method_types: ['card'],
    })
}

export async function attachPaymentMethod(params: { customerId: string; paymentMethodId: string }) {
    return stripe.paymentMethods.attach(params.paymentMethodId, {
        customer: params.customerId,
    })
}

export async function getPaymentMethods(params: { customerId: string }) {
    return stripe.paymentMethods.list({
        customer: params.customerId,
        type: 'card',
    })
}

export async function detachPaymentMethod(params: { paymentMethodId: string }) {
    return stripe.paymentMethods.detach(params.paymentMethodId)
}

export async function createPaymentIntentWithCommission(params: {
    amount: number
    stripeCustomerId: string
    companyAdminStripeId: string
    transactionCode: string
}) {
    const { amount, stripeCustomerId, companyAdminStripeId, transactionCode } = params

    const EXCHANGE_RATE_VND_PER_USD = 26000n
    const COMMISSION_PERCENT = 15n

    const usdAmount = Number(
        (BigInt(amount) * 100n + EXCHANGE_RATE_VND_PER_USD / 2n) / EXCHANGE_RATE_VND_PER_USD
    )

    const applicationFee = Number((BigInt(usdAmount) * COMMISSION_PERCENT + 50n) / 100n)

    return stripe.paymentIntents.create({
        amount: usdAmount,
        currency: 'usd',
        customer: stripeCustomerId,
        application_fee_amount: applicationFee,
        transfer_data: {
            destination: companyAdminStripeId,
        },
        metadata: {
            transactionCode,
            originalVndAmount: String(amount),
            exchangeRateVndPerUsd: String(EXCHANGE_RATE_VND_PER_USD),
            usdAmountCents: String(usdAmount),
            commissionPercent: String(COMMISSION_PERCENT),
            applicationFeeCents: String(applicationFee),
        },
    })
}

export async function createRefund(params: { paymentIntentId: string }) {
    return stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        refund_application_fee: true,
        reverse_transfer: true,
        reason: 'requested_by_customer',
    })
}
