import { stripe } from "../client/index.js";
import { AuthUserId } from "../../../database/auth/user/type.js";

export async function createConnectAccount(userId: AuthUserId) {
    const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
    });
    return account.id;
}

export async function linkBankAccount( accountId: string) {
    return await stripe.accountLinks.create({
        account: accountId,
        refresh_url: process.env.STRIPE_REFRESH_URL ?? '',
        return_url: process.env.STRIPE_REDIRECT_URL ?? '',
        type: 'account_onboarding',
    });
}