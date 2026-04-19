import { stripe } from '../client/index.js'

export async function createConnectAccount(params: { email?: string }) {
    const { email } = params

    return stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
            transfers: { requested: true },
        },
        settings: {
            payouts: {
                schedule: {
                    interval: "weekly",
                    weekly_anchor: "friday"
                }
            }
        }
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
    return await stripe.balance.retrieve({}, {
        stripeAccount: accountId,
    });
   
}