import { dal } from '../../database/index.js'
import { utils } from '../../utils/index.js'
import { PaymentMethodRequest } from '../../model/query/payment/index.js'
import { PaymentMethod, PaymentStatus } from '../../database/payment/payment/type.js'
import { service } from '../../service/index.js'
import { HttpErr } from '../../app/index.js'
import { BookingId } from '../../database/booking/booking/type.js'
import { db } from '../../datasource/db.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { PaymentFilter, PeriodPaymentQuery } from '../../model/query/payment/index.js'
import { FastifyReply } from 'fastify'
import { UserInfo } from '../../model/common.js'

async function preparePayment(bookingId: BookingId, method: PaymentMethod | null) {
    let payment = await dal.payment.payment.query.getPayment(bookingId)

    if (payment) {
        if (payment.status === PaymentStatus.enum.success) {
            throw new HttpErr.UnprocessableEntity(
                'Payment already confirmed',
                'PAYMENT_ALREADY_CONFIRMED'
            )
        }

        if (
            payment.status === PaymentStatus.enum.failed ||
            (payment.expiredAt && payment.expiredAt < utils.time.getNow().toDate())
        ) {
            throw new HttpErr.UnprocessableEntity(
                'Payment failed or expired',
                'PAYMENT_FAILED_OR_EXPIRED'
            )
        }

        return payment
    }

    const amount = (await dal.booking.booking.query.getAmountByBookingId(bookingId)).totalAmount

    return dal.payment.payment.cmd.upsertPayment({
        bookingId,
        transactionCode: utils.random.generateRandomNumber(12).toString(),
        method,
        status: PaymentStatus.enum.pending,
        amount,
    })
}

export async function createPayment(params: PaymentMethodRequest, userId: AuthUserId, ip: string) {
    const { method } = params

    const bookingInfo = await dal.booking.booking.query.getBookingByUserIdAndBookingId({
        userId: userId,
        bookingId: params.id,
    })

    if (!bookingInfo) {
        throw new HttpErr.Forbidden('You are not allowed to create payment for this booking')
    }

    switch (method) {
        case PaymentMethod.enum.vnpay:
            return createVnpayPayment(params, ip)
        case PaymentMethod.enum.cash:
            return createCashPayment(params)
        case PaymentMethod.enum.stripe:
            return createStripePayment(params, userId)
        default:
            throw new HttpErr.UnprocessableEntity(
                'Invalid payment method',
                'INVALID_PAYMENT_METHOD'
            )
    }
}

export async function createCashPayment(params: PaymentMethodRequest) {
    const payment = await preparePayment(params.id, PaymentMethod.enum.cash)

    await dal.booking.booking.cmd.updateExpiredBooking(params.id)

    return {
        message: 'Please pay when you board the bus',
        payment,
    }
}

export async function createVnpayPayment(params: PaymentMethodRequest, ip: string) {
    const payment = await preparePayment(params.id, PaymentMethod.enum.vnpay)

    return {
        message: 'OK',
        paymentUrl: service.vnpay.init.initiatePayment(payment.amount, payment.transactionCode, ip),
    }
}

export async function vnpayIpn(query: Record<string, string>, reply: FastifyReply) {
    const vnpParams = service.vnpay.verify.verifyIpn(query)

    if ('RspCode' in vnpParams) {
        return vnpParams
    }

    const { vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_TransactionNo, vnp_PayDate } = vnpParams

    if (!vnp_TxnRef || vnp_Amount == null || !vnp_ResponseCode) {
        return { RspCode: '99', Message: 'Invalid request' }
    }

    return db.transaction().execute(async tx => {
        const payment = await dal.payment.payment.query.getPayment(undefined, vnp_TxnRef, tx)

        if (!payment) {
            return { RspCode: '01', Message: 'Payment not found' }
        }

        if (payment.status === PaymentStatus.enum.success) {
            return { RspCode: '00', Message: 'Already confirmed' }
        }

        if (payment.amount !== Number(vnp_Amount) / 100) {
            return { RspCode: '04', Message: 'Invalid amount' }
        }

        if (vnp_ResponseCode !== '00') {
            await dal.payment.payment.cmd.updatePaymentStatusFailed(vnp_TxnRef, tx)
            return { RspCode: '24', Message: 'Payment failed' }
        }

        await dal.payment.payment.cmd.updatePaymentStatusSuccess(
            vnp_TxnRef,
            vnp_TransactionNo,
            vnp_PayDate,
            tx
        )
        return { RspCode: '00', Message: 'Confirm Success' }
    })
}

export async function getPayments(q: PaymentFilter, companyId: OrganizationBusCompanyId) {
    const payments = await dal.payment.payment.query.getPayments(q, companyId)

    const { data, next } = utils.common.paginateByCursor(payments, q.limit)

    return {
        payments: data,
        next: next,
    }
}

export async function getRevenueByCompanyId(companyId: OrganizationBusCompanyId) {
    return dal.payment.payment.query.getTotalRevenueByCompanyId(companyId)
}

export async function updateByTransactionCode(transactionCode: string) {
    return dal.payment.payment.cmd.updatePaymentByTransactionCode(transactionCode)
}

export async function getPeriodRevenue(params: PeriodPaymentQuery) {
    const data = await dal.payment.payment.query.getPeriodRevenue(params)
    return { data: data }
}

export async function linkStripeAccount(userInfo: UserInfo) {
    const user = await dal.auth.user.query.getOne({ id: userInfo.id })
    if (!user) {
        throw new HttpErr.NotFound('USER_NOT_FOUND')
    }

    let accountStripeId = user.accountStripeId
    if (!accountStripeId) {
        const account = await service.stripe.connect.createConnectAccount({
            email: user.email,
        })
        await dal.auth.user.cmd.updateOne(userInfo.id, {
            accountStripeId: account.id,
        })
        accountStripeId = account.id
    }

    const result = await service.stripe.connect.linkBankAccount(accountStripeId)

    return {
        message: 'OK',
        url: result.url,
    }
}

export async function callback(p: UserInfo) {
    const user = await dal.auth.user.query.getOne({ id: p.id })

    if (!user) {
        throw new HttpErr.NotFound('USER_NOT_FOUND')
    }

    const result = await service.stripe.connect.callbackRetrieveAccount(user.accountStripeId ?? '')

    return {
        chargesEnabled: result.charges_enabled,
        payoutsEnabled: result.payouts_enabled,
    }
}

async function createStripePayment(params: PaymentMethodRequest, userId: AuthUserId) {
    const payment = await preparePayment(params.id, PaymentMethod.enum.stripe)

    const user = await dal.auth.user.query.getOne({ id: userId })
    if (!user?.accountStripeId) {
        throw new HttpErr.UnprocessableEntity(
            'Customer Stripe account not found',
            'CUSTOMER_STRIPE_NOT_FOUND'
        )
    }

    const companyRow = await dal.payment.payment.query.getCompanyIdByBookingId(params.id)
    if (!companyRow?.companyId) {
        throw new HttpErr.UnprocessableEntity(
            'Company not found for this booking',
            'COMPANY_NOT_FOUND'
        )
    }

    const companyAdmin = await dal.auth.user.query.getCompanyStripeAccountId(companyRow.companyId)
    if (!companyAdmin?.accountStripeId) {
        throw new HttpErr.UnprocessableEntity(
            'Company has not linked Stripe account',
            'COMPANY_STRIPE_NOT_LINKED'
        )
    }

    const paymentIntent = await service.stripe.client.createPaymentIntentWithCommission({
        amount: payment.amount,
        stripeCustomerId: user.accountStripeId,
        companyAdminStripeId: companyAdmin.accountStripeId,
        transactionCode: payment.transactionCode,
    })

    await dal.booking.booking.cmd.updateExpiredBooking(params.id)

    return {
        message: 'OK',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        payment,
    }
}
