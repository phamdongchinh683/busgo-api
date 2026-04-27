import { stripe } from '../client/index.js'
import { StripePayoutListRequest } from '../type.js'

export async function createConnectAccount(params: { email?: string }) {
    const { email } = params

    return stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        business_type: 'individual',
        capabilities: {
            transfers: { requested: true },
        },
        business_profile: {
            url: process.env.SYSTEM_DOMAIN ?? '',
        },
        settings: {
            payouts: {
                schedule: {
                    interval: 'monthly',
                    monthly_anchor: 1,
                },
            },
        },
    })
}

export async function linkBankAccount(accountId: string) {
    return stripe.accountLinks.create({
        account: accountId,
        type: 'account_onboarding',
        refresh_url: process.env.STRIPE_REFRESH_URL ?? '',
        return_url: process.env.STRIPE_REDIRECT_URL ?? '',
    })
}

export async function callbackRetrieveAccount(accountId: string) {
    return stripe.accounts.retrieve(accountId)
}

export async function getConnectedAccountBalance(accountId: string) {
    return await stripe.balance.retrieve(
        {},
        {
            stripeAccount: accountId,
        }
    )
}

export async function payout(params: { amount: number; accountStripeId: string }) {
    return stripe.payouts.create(
        {
            amount: params.amount,
            currency: 'usd',
        },
        {
            stripeAccount: params.accountStripeId,
        }
    )
}

export async function listPayouts(q: StripePayoutListRequest, accountStripeId: string) {
    return stripe.payouts.list(
        {
            starting_after: q.next,
            status: q.status,
            limit: q.limit,
        },
        {
            stripeAccount: accountStripeId,
        }
    )
}
