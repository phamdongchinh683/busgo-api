import { stripe } from '../client/index.js'

export async function createConnectAccount(params: {
    email?: string
    metadata?: Record<string, string>
}) {
    const { email, metadata } = params

    return stripe.accounts.create({
        type: 'express',
        country: 'US',
        email,
        business_type: 'individual',
        individual: {
            email,
        },
        capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
        },
        metadata,
    })
}

export async function linkBankAccount(accountId: string) {
    return stripe.accountLinks.create({
        account: accountId,
        type: 'account_onboarding',
        refresh_url: process.env.STRIPE_REFRESH_URL ?? '',
        return_url: process.env.STRIPE_REDIRECT_URL ?? '',
        collection_options: {
            fields: 'currently_due',
        },
    })
}

export async function callbackRetrieveAccount(accountId: string) {
    return stripe.accounts.retrieve(accountId)
}
