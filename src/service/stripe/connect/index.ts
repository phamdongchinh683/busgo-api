import { stripe } from '../client/index.js'

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
                    interval: 'weekly',
                    weekly_anchor: 'monday',
                    delay_days: 2,
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
export async function updatePayoutSchedule(accountId: string) {
    return stripe.accounts.update(accountId, {
        settings: {
            payouts: {
                schedule: {
                    interval: 'weekly',
                    weekly_anchor: 'monday',
                    delay_days: 2,
                },
            },
        },
    })
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

export async function listPayouts(accountStripeId: string) {
    return stripe.payouts.list(
        {},
        {
            stripeAccount: accountStripeId,
        }
    )
}
