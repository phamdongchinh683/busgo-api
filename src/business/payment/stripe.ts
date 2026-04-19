import { UserInfo } from '../../model/common.js'
import { service } from '../../service/index.js'
import { dal } from '../../database/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'

export async function setUpIntent(userInfo: UserInfo) {
    const intent = await service.stripe.client.createSetupIntent({
        customerId: userInfo.accountStripeId ?? '',
    })
    return {
        clientSecret: intent.client_secret ?? '',
    }
}

export async function addPaymentMethod(userInfo: UserInfo, paymentMethodId: string) {
    const paymentMethod = await service.stripe.client.attachPaymentMethod({
        customerId: userInfo.accountStripeId ?? '',
        paymentMethodId: paymentMethodId,
    })

    if (userInfo.accountStripeId) {
        await dal.payment.customerPaymentMethod.cmd.upsertOne({
            userId: userInfo.id,
            stripeCustomerId: userInfo.accountStripeId,
            stripePaymentMethodId: paymentMethod.id,
            brand: paymentMethod.card?.brand ?? null,
            last4: paymentMethod.card?.last4 ?? null,
            expMonth: paymentMethod.card?.exp_month ?? null,
            expYear: paymentMethod.card?.exp_year ?? null,
            isDefault: false,
        })
    }

    return {
        message: 'OK',
    }
}

export async function listPaymentMethods(userInfo: UserInfo) {
    return {
        paymentMethods: await dal.payment.customerPaymentMethod.cmd.findMany(userInfo.id),
    }
}

export async function setDefault(userInfo: UserInfo, paymentMethodId: string) {
    await service.stripe.client.setDefaultPaymentMethod({
        customerId: userInfo.accountStripeId ?? '',
        paymentMethodId: paymentMethodId,
    })

    await dal.payment.customerPaymentMethod.cmd.upsertOne({
        userId: userInfo.id,
        stripeCustomerId: userInfo.accountStripeId ?? '',
        stripePaymentMethodId: paymentMethodId,
        isDefault: true,
    })

    return {
        message: 'OK',
    }
}

export async function removePaymentMethod(params: { user: UserInfo; paymentMethodId: string }) {
    await service.stripe.client.detachPaymentMethod({
        paymentMethodId: params.paymentMethodId,
    })

    await dal.payment.customerPaymentMethod.cmd.deleteOne({
        userId: params.user.id,
        stripePaymentMethodId: params.paymentMethodId,
        accountStripeId: params.user.accountStripeId ?? '',
    })

    return {
        message: 'OK',
    }
}

export async function getBalance(accountStripeId: string) {
    const balance = await service.stripe.connect.getConnectedAccountBalance(accountStripeId)
    return {
        available: balance.available,
        pending: balance.pending,
    }
}
