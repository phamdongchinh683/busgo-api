import { UserInfo } from '../../model/common.js'
import { service } from '../../service/index.js'
import { dal } from '../../database/index.js'
import { HttpErr } from '../../app/index.js'
import { auth } from '../../app/jwt/index.js'
import type { BalanceResponse, StripePayoutListRequest } from '../../service/stripe/type.js'
import { db } from '../../datasource/db.js'
import { utils } from '../../utils/index.js'
import { stripeAccountStatusCacheKey } from './payment.js'
import { stripeCacheKey, stripeCachePayload } from './stripe-cache.js'

const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/USD'
const EXCHANGE_RATE_CACHE_TTL_MS = 5 * 60 * 1000
const BALANCE_CACHE_PREFIX = 'stripe:balance'
const BALANCE_CACHE_TTL_SECONDS = 30

type ExchangeRate = {
    usdToVnd: number
    vndToUsd: number
}

let exchangeRateCache: { expiresAt: number; value: ExchangeRate } | null = null

function balanceCacheKey(userInfo: UserInfo) {
    return stripeCacheKey(BALANCE_CACHE_PREFIX, userInfo)
}

async function clearBalanceCache(userInfo: UserInfo) {
    await utils.cache.delCache(balanceCacheKey(userInfo))
}

async function getUsdVndRate() {
    if (exchangeRateCache && exchangeRateCache.expiresAt > Date.now()) {
        return exchangeRateCache.value
    }

    const response = await fetch(EXCHANGE_RATE_API_URL)

    if (!response.ok) {
        throw new HttpErr.BadRequest('Không thể lấy tỷ giá.', 'EXCHANGE_RATE_UNAVAILABLE')
    }

    const data = await response.json()
    const usdToVnd = data.rates?.VND

    if (!usdToVnd || usdToVnd <= 0) {
        throw new HttpErr.BadRequest('Không thể lấy tỷ giá.', 'EXCHANGE_RATE_UNAVAILABLE')
    }

    const rate = {
        usdToVnd: usdToVnd,
        vndToUsd: 1 / usdToVnd,
    }

    exchangeRateCache = {
        value: rate,
        expiresAt: Date.now() + EXCHANGE_RATE_CACHE_TTL_MS,
    }

    return rate
}

export async function setUpIntent(userInfo: UserInfo) {
    const user = await dal.auth.user.query.getOne({ id: userInfo.id })
    if (!user?.accountStripeId) {
        throw new HttpErr.UnprocessableEntity(
            'Không tìm thấy tài khoản Stripe của khách hàng.',
            'CUSTOMER_STRIPE_NOT_FOUND'
        )
    }
    const intent = await service.stripe.client.createSetupIntent({
        customerId: user.accountStripeId,
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
        message: 'Thành công.',
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

    await db.transaction().execute(async trx => {
        await dal.payment.customerPaymentMethod.cmd.resetDefaultByUser(
            {
                userId: userInfo.id,
                stripeCustomerId: userInfo.accountStripeId ?? '',
            },
            trx
        )

        await dal.payment.customerPaymentMethod.cmd.updateOne(
            {
                userId: userInfo.id,
                accountStripeId: userInfo.accountStripeId ?? '',
                stripePaymentMethodId: paymentMethodId,
                isDefault: true,
            },
            trx
        )
    })

    return {
        message: 'Thành công.',
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
        message: 'Thành công.',
    }
}

export async function getBalance(userInfo: UserInfo) {
    return utils.cache.cacheQuery<BalanceResponse>({
        prefix: BALANCE_CACHE_PREFIX,
        query: stripeCachePayload(userInfo),
        ttl: BALANCE_CACHE_TTL_SECONDS,
        queryFn: async () => {
            const balance = await service.stripe.connect.getConnectedAccountBalance(userInfo.accountStripeId ?? '')

            return {
                available: balance.available,
                pending: balance.pending,
            }
        },
    })
}

export async function linkStripeAccount(userInfo: UserInfo) {
    const previousUserInfo = { ...userInfo }
    let accountStripeId = userInfo.accountStripeId

    if (!accountStripeId) {
        const account = await service.stripe.connect.createConnectAccount({
            email: userInfo.email,
        })

        const newTokenVersion = userInfo.tokenVersion + 1

        await dal.auth.user.cmd.updateOne(userInfo.id, {
            accountStripeId: account.id,
            tokenVersion: newTokenVersion,
        })

        accountStripeId = account.id
        userInfo.tokenVersion = newTokenVersion
    }

    const nextUserInfo = { ...userInfo, accountStripeId }
    const result = await service.stripe.connect.linkBankAccount(accountStripeId)

    await Promise.all([
        utils.cache.delCache(`auth:token-version:${userInfo.id}`),
        utils.cache.delCache(stripeAccountStatusCacheKey(previousUserInfo)),
        utils.cache.delCache(stripeAccountStatusCacheKey(nextUserInfo)),
        utils.cache.delCache(`stripe:account-status:${userInfo.id}`),
    ])

    return {
        message: 'Thành công.',
        url: result.url,
        token: auth.generateToken({
            ...userInfo,
            tokenVersion: userInfo.tokenVersion,
            accountStripeId,
        }),
    }
}
export async function withdrawBalance(params: { amount: number; userInfo: UserInfo }) {
    const accountStripeId = params.userInfo.accountStripeId

    if (!accountStripeId) {
        throw new HttpErr.UnprocessableEntity(
            'Không tìm thấy tài khoản Stripe.',
            'STRIPE_ACCOUNT_NOT_FOUND'
        )
    }

    const [rate, balance] = await Promise.all([
        getUsdVndRate(),
        service.stripe.connect.getConnectedAccountBalance(accountStripeId),
    ])

    const usdAmount = params.amount / rate.usdToVnd
    const payoutAmountUsdCents = Math.round(usdAmount * 100)

    if (payoutAmountUsdCents <= 0) {
        throw new HttpErr.BadRequest('Số tiền rút quá nhỏ.', 'INVALID_PAYOUT_AMOUNT')
    }

    const available = balance.available.find(i => i.currency === 'usd')
    const availableAmount = available?.amount ?? 0

    if (payoutAmountUsdCents > availableAmount) {
        throw new HttpErr.UnprocessableEntity(
            'Số dư khả dụng không đủ.',
            'INSUFFICIENT_AVAILABLE_BALANCE',
            {
                requestedAmountVnd: params.amount,
                requestedAmountUsd: payoutAmountUsdCents / 100,
                availableAmount: availableAmount / 100,
            }
        )
    }

    await service.stripe.connect.payout({
        amount: payoutAmountUsdCents,
        accountStripeId,
    })

    await clearBalanceCache(params.userInfo)

    return {
        message: 'Thành công.',
        amountVnd: params.amount,
        amountUsdCents: payoutAmountUsdCents,
    }
}

export async function getPayouts(q: StripePayoutListRequest, accountStripeId: string) {
    const payouts = await service.stripe.connect.listPayouts(q, accountStripeId)
    const next = payouts.has_more ? (payouts.data[payouts.data.length - 1]?.id ?? null) : null

    return {
        payouts: payouts.data,
        next: next,
    }
}
