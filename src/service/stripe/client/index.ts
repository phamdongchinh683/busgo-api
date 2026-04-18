import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ''

export const stripe = new Stripe(STRIPE_SECRET_KEY, {})

export async function createCustomer(params: {
    email: string
    phone: string
    name: string
    metadata: Record<string, string>
}) {
    const { email, phone, name, metadata } = params

    return stripe.customers.create({
        email,
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
