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

function getStripePaymentAmounts(amount: number) {
    const EXCHANGE_RATE_VND_PER_USD = 26000n
    const COMMISSION_PERCENT = 15n

    const usdAmount = Number(
        (BigInt(amount) * 100n + EXCHANGE_RATE_VND_PER_USD / 2n) / EXCHANGE_RATE_VND_PER_USD
    )

    const applicationFee = Number((BigInt(usdAmount) * COMMISSION_PERCENT + 50n) / 100n)

    return {
        usdAmount,
        applicationFee,
        exchangeRateVndPerUsd: EXCHANGE_RATE_VND_PER_USD,
        commissionPercent: COMMISSION_PERCENT,
    }
}

function getStripePaymentMetadata(params: {
    amount: number
    transactionCode: string
    usdAmount: number
    exchangeRateVndPerUsd: bigint
    commissionPercent: bigint
    applicationFee: number
}) {
    return {
        transactionCode: params.transactionCode,
        originalVndAmount: String(params.amount),
        exchangeRateVndPerUsd: String(params.exchangeRateVndPerUsd),
        usdAmountCents: String(params.usdAmount),
        commissionPercent: String(params.commissionPercent),
        applicationFeeCents: String(params.applicationFee),
    }
}

type StripePaymentWithCommissionParams = {
    amount: number
    stripeCustomerId: string
    companyAdminStripeId: string
    transactionCode: string
}

export async function createPaymentIntentWithCommission(params: StripePaymentWithCommissionParams) {
    const { amount, stripeCustomerId, companyAdminStripeId, transactionCode } = params

    const { usdAmount, applicationFee, exchangeRateVndPerUsd, commissionPercent } =
        getStripePaymentAmounts(amount)

    return stripe.paymentIntents.create(
        {
            amount: usdAmount,
            currency: 'usd',
            customer: stripeCustomerId,
            application_fee_amount: applicationFee,
            transfer_data: {
                destination: companyAdminStripeId,
            },
            metadata: getStripePaymentMetadata({
                amount,
                transactionCode,
                usdAmount,
                exchangeRateVndPerUsd,
                commissionPercent,
                applicationFee,
            }),
        },
        {
            idempotencyKey: `payment-intent:${transactionCode}`,
        }
    )
}

export async function createCheckoutSessionWithCommission(
    params: StripePaymentWithCommissionParams & {
        successUrl: string
        cancelUrl: string
    }
) {
    const {
        amount,
        stripeCustomerId,
        companyAdminStripeId,
        transactionCode,
        successUrl,
        cancelUrl,
    } = params
    const { usdAmount, applicationFee, exchangeRateVndPerUsd, commissionPercent } =
        getStripePaymentAmounts(amount)
    const metadata = getStripePaymentMetadata({
        amount,
        transactionCode,
        usdAmount,
        exchangeRateVndPerUsd,
        commissionPercent,
        applicationFee,
    })

    return stripe.checkout.sessions.create(
        {
            mode: 'payment',
            customer: stripeCustomerId,
            success_url: successUrl,
            cancel_url: cancelUrl,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'usd',
                        unit_amount: usdAmount,
                        product_data: {
                            name: `BusGo ticket ${transactionCode}`,
                        },
                    },
                },
            ],
            payment_intent_data: {
                application_fee_amount: applicationFee,
                transfer_data: {
                    destination: companyAdminStripeId,
                },
                metadata,
            },
            metadata,
        },
        {
            idempotencyKey: `checkout-session:${transactionCode}`,
        }
    )
}

export async function createRefund(params: { paymentIntentId: string; idempotencyKey?: string }) {
    return stripe.refunds.create(
        {
            payment_intent: params.paymentIntentId,
            refund_application_fee: true,
            reverse_transfer: true,
            reason: 'requested_by_customer',
        },
        params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined
    )
}
