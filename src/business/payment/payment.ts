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
import {
    PaymentFilter,
    PeriodPaymentQuery,
    RevenueExportQuery,
} from '../../model/query/payment/index.js'
import { FastifyReply } from 'fastify'
import { UserInfo } from '../../model/common.js'
import type { StripeStatusResponse } from '../../service/stripe/type.js'
import { stripeCacheKey, stripeCachePayload, type StripeCacheOwner } from './stripe-cache.js'

const vnpayClientReturnUrl = process.env.VNPAY_CLIENT_RETURN_URL ?? ''
const STRIPE_ACCOUNT_STATUS_CACHE_PREFIX = 'stripe:account-status'
const STRIPE_ACCOUNT_STATUS_CACHE_TTL_SECONDS = 60

export function stripeAccountStatusCacheKey(userInfo: StripeCacheOwner) {
    return stripeCacheKey(STRIPE_ACCOUNT_STATUS_CACHE_PREFIX, userInfo)
}

async function preparePayment(bookingId: BookingId, method: PaymentMethod | null) {
    let payment = await dal.payment.payment.query.getPayment(bookingId)

    if (payment) {
        if (payment.status === PaymentStatus.enum.success) {
            throw new HttpErr.UnprocessableEntity(
                'Thanh toán đã được xác nhận.',
                'PAYMENT_ALREADY_CONFIRMED'
            )
        }

        if (
            payment.status === PaymentStatus.enum.failed ||
            (payment.expiredAt && payment.expiredAt < utils.time.getNow().toDate())
        ) {
            throw new HttpErr.UnprocessableEntity(
                'Thanh toán đã thất bại hoặc đã hết hạn.',
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
        throw new HttpErr.Forbidden('Bạn không có quyền tạo thanh toán cho đặt vé này.')
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
                'Phương thức thanh toán không hợp lệ.',
                'INVALID_PAYMENT_METHOD'
            )
    }
}

export async function createCashPayment(params: PaymentMethodRequest) {
    const payment = await preparePayment(params.id, PaymentMethod.enum.cash)

    await dal.booking.booking.cmd.updateExpiredBooking(params.id)

    return {
        message: 'Vui lòng thanh toán khi lên xe.',
        payment,
    }
}

export async function createVnpayPayment(params: PaymentMethodRequest, ip: string) {
    const payment = await preparePayment(params.id, PaymentMethod.enum.vnpay)

    return {
        message: 'Thành công.',
        paymentUrl: service.vnpay.init.initiatePayment(payment.amount, payment.transactionCode, ip),
    }
}

async function confirmVnpayPayment(query: Record<string, string>) {
    const vnpParams = service.vnpay.verify.verifyIpn(query)

    if ('RspCode' in vnpParams) {
        return vnpParams
    }

    const { vnp_TxnRef, vnp_Amount, vnp_ResponseCode, vnp_TransactionNo, vnp_PayDate } = vnpParams

    if (!vnp_TxnRef || vnp_Amount == null || !vnp_ResponseCode) {
        return { RspCode: '99', Message: 'Yêu cầu không hợp lệ' }
    }

    return db.transaction().execute(async tx => {
        const payment = await dal.payment.payment.query.getPayment(undefined, vnp_TxnRef, tx)

        if (!payment) {
            return { RspCode: '01', Message: 'Không tìm thấy thanh toán' }
        }

        if (payment.status === PaymentStatus.enum.success) {
            return { RspCode: '00', Message: 'Thanh toán đã được xác nhận' }
        }

        if (payment.amount !== Number(vnp_Amount) / 100) {
            return { RspCode: '04', Message: 'Số tiền thanh toán không hợp lệ' }
        }

        if (vnp_ResponseCode !== '00') {
            await dal.payment.payment.cmd.updatePaymentStatusFailed(vnp_TxnRef, tx)
            return { RspCode: '24', Message: 'Thanh toán thất bại' }
        }

        await dal.payment.payment.cmd.updatePaymentStatusSuccess(
            vnp_TxnRef,
            vnp_TransactionNo,
            vnp_PayDate,
            tx
        )
        return { RspCode: '00', Message: 'Xác nhận thanh toán thành công' }
    })
}

export async function vnpayReturn(query: Record<string, string>, reply: FastifyReply) {
    const result = await confirmVnpayPayment(query)
    if (!vnpayClientReturnUrl) {
        return result
    }

    const redirectUrl = new URL(vnpayClientReturnUrl)
    redirectUrl.searchParams.set('status', result.RspCode === '00' ? 'success' : 'failed')
    redirectUrl.searchParams.set('code', result.RspCode ?? '99')
    redirectUrl.searchParams.set('message', result.Message ?? '')

    if (query.vnp_TxnRef) {
        redirectUrl.searchParams.set('transactionCode', query.vnp_TxnRef)
    }

    return reply.redirect(redirectUrl.toString())
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

export async function exportCompanyRevenueExcel(params: RevenueExportQuery) {
    const year = params.year ?? utils.time.getNow().year()
    const meta = { year, method: params.method }
    if (params.type === 'monthly') {
        const rows = await dal.payment.payment.query.getRevenueByCompanyMonthlyForPeriod(params)
        return service.excel.buildCompanyRevenueMonthlySheet(rows, meta)
    }
    const rows = await dal.payment.payment.query.getRevenueByCompanyYearlyForPeriod(params)
    return service.excel.buildCompanyRevenueYearlySheet(rows, meta)
}

export async function stripeStatus(p: UserInfo): Promise<StripeStatusResponse> {
    return utils.cache.cacheQuery<StripeStatusResponse>({
        prefix: STRIPE_ACCOUNT_STATUS_CACHE_PREFIX,
        query: stripeCachePayload(p),
        ttl: STRIPE_ACCOUNT_STATUS_CACHE_TTL_SECONDS,
        queryFn: async () => {
            if (!p.accountStripeId) {
                return {
                    chargesEnabled: false,
                    payoutsEnabled: false,
                    currentlyDue: [],
                }
            }

            const result = await service.stripe.connect.callbackRetrieveAccount(p.accountStripeId)

            return {
                chargesEnabled: result.charges_enabled,
                payoutsEnabled: result.payouts_enabled,
                currentlyDue: result.requirements?.currently_due ?? [],
            }
        },
    })
}

async function createStripePayment(params: PaymentMethodRequest, userId: AuthUserId) {
    const payment = await preparePayment(params.id, PaymentMethod.enum.stripe)

    const user = await dal.auth.user.query.getOne({ id: userId })
    if (!user?.accountStripeId) {
        throw new HttpErr.UnprocessableEntity(
            'Không tìm thấy tài khoản Stripe của khách hàng.',
            'CUSTOMER_STRIPE_NOT_FOUND'
        )
    }

    const companyRow = await dal.payment.payment.query.getCompanyIdByBookingId(params.id)
    if (!companyRow?.companyId) {
        throw new HttpErr.UnprocessableEntity(
            'Không tìm thấy công ty cho đặt vé này.',
            'COMPANY_NOT_FOUND'
        )
    }

    const companyAdmin = await dal.auth.user.query.getCompanyStripeAccountId(companyRow.companyId)

    if (!companyAdmin?.accountStripeId) {
        throw new HttpErr.UnprocessableEntity(
            'Công ty chưa liên kết tài khoản Stripe.',
            'COMPANY_STRIPE_NOT_LINKED'
        )
    }

    const paymentIntent = await service.stripe.client.createPaymentIntentWithCommission({
        amount: payment.amount,
        stripeCustomerId: user.accountStripeId,
        companyAdminStripeId: companyAdmin.accountStripeId,
        transactionCode: payment.transactionCode,
    })

    return {
        message: 'Thành công.',
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        payment: payment,
    }
}
