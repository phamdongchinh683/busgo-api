import { dal } from '../../database/index.js'
import { utils } from '../../utils/index.js'
import { PaymentMethodRequest } from '../../model/query/payment/index.js'
import { PaymentMethod, PaymentStatus } from '../../database/booking/booking/type.js'
import { service } from '../../service/index.js'
import { HttpErr } from '../../app/index.js'
import { BookingId, BookingType } from '../../database/booking/booking/type.js'
import { BookingCouponId } from '../../database/booking/coupon/type.js'
import { applyCoupon, validateCoupon } from '../booking/coupon.js'
import { db } from '../../datasource/db.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { Transaction } from 'kysely'
import { Database } from '../../datasource/type.js'
import { PeriodPaymentQuery, RevenueExportQuery } from '../../model/query/payment/index.js'
import { FastifyReply } from 'fastify'
import { UserInfo } from '../../model/common.js'
import type { StripeStatusResponse } from '../../service/stripe/type.js'
import { stripeCacheKey, stripeCachePayload, type StripeCacheOwner } from './stripe-cache.js'

const vnpayClientReturnUrl = process.env.VNPAY_CLIENT_RETURN_URL ?? ''
const stripePaymentClientReturnUrl =
    process.env.STRIPE_PAYMENT_CLIENT_RETURN_URL ??
    process.env.STRIPE_CLIENT_RETURN_URL ??
    process.env.SYSTEM_DOMAIN ??
    ''
const STRIPE_ACCOUNT_STATUS_CACHE_PREFIX = 'stripe:account-status'
const STRIPE_ACCOUNT_STATUS_CACHE_TTL_SECONDS = 60

export function stripeAccountStatusCacheKey(userInfo: StripeCacheOwner) {
    return stripeCacheKey(STRIPE_ACCOUNT_STATUS_CACHE_PREFIX, userInfo)
}

function buildStripePaymentReturnUrl(status: 'success' | 'cancelled', transactionCode: string) {
    if (!stripePaymentClientReturnUrl) {
        throw new HttpErr.BadRequest(
            'Chưa cấu hình URL trả về cho thanh toán Stripe.',
            'STRIPE_PAYMENT_RETURN_URL_NOT_CONFIGURED'
        )
    }

    let redirectUrl: URL
    try {
        redirectUrl = new URL(stripePaymentClientReturnUrl)
    } catch {
        throw new HttpErr.BadRequest(
            'URL trả về cho thanh toán Stripe không hợp lệ.',
            'STRIPE_PAYMENT_RETURN_URL_INVALID'
        )
    }

    redirectUrl.searchParams.set('status', status)
    redirectUrl.searchParams.set('provider', 'stripe')
    redirectUrl.searchParams.set('transactionCode', transactionCode)
    return redirectUrl.toString()
}

async function preparePayment(
    bookingId: BookingId,
    method: PaymentMethod | null,
    tx?: Transaction<Database>
) {
    const currentTotal = (await dal.booking.booking.query.getAmountByBookingId(bookingId, tx))
        .totalAmount

    const payment = await dal.booking.booking.query.getPayment(bookingId, undefined, tx)

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

        if (payment.status === method) {
            return payment
        }

        return dal.booking.booking.cmd.upsertPayment(
            {
                bookingId,
                transactionCode: utils.random.generateRandomNumber(12).toString(),
                method,
                status: PaymentStatus.enum.pending,
                amount: currentTotal,
            },
            tx
        )
    }

    return dal.booking.booking.cmd.upsertPayment(
        {
            bookingId,
            transactionCode: utils.random.generateRandomNumber(12).toString(),
            method,
            status: PaymentStatus.enum.pending,
            amount: currentTotal,
        },
        tx
    )
}

async function applyCouponToPendingBooking(bookingId: BookingId, couponId: BookingCouponId) {
    await db.transaction().execute(async trx => {
        const booking = await trx
            .selectFrom('booking.booking')
            .select(['id', 'status', 'couponId', 'originalAmount', 'totalAmount'])
            .where('id', '=', bookingId)
            .forUpdate()
            .executeTakeFirstOrThrow()

        if (booking.status === 'success') {
            return
        }

        if (booking.couponId === couponId) {
            return
        }

        if (booking.couponId != null) {
            await dal.booking.coupon.cmd.upCountUsedQuantity(booking.couponId, '-', trx)
        }

        const gross = booking.originalAmount ?? booking.totalAmount ?? 0

        const coupon = await dal.booking.coupon.cmd.getCouponByCodeTransaction(
            { id: couponId, orderTotal: gross },
            trx
        )

        if (!coupon) {
            throw new HttpErr.UnprocessableEntity('Mã giảm giá không hợp lệ.', 'COUPON_NOT_FOUND')
        }

        validateCoupon(coupon, gross)

        const { discountAmount, finalTotal } = applyCoupon(coupon, gross)

        await trx
            .updateTable('booking.booking')
            .set({
                couponId,
                discountAmount,
                totalAmount: finalTotal,
            })
            .where('id', '=', bookingId)
            .execute()
    })
}

export async function createPayment(params: PaymentMethodRequest, userId: AuthUserId, ip: string) {
    const { method, couponId } = params
    const bookingId = params.id

    const bookingInfo = await dal.booking.booking.query.getBookingByUserIdAndBookingId({
        userId: userId,
        bookingId,
    })

    if (!bookingInfo) {
        throw new HttpErr.Forbidden('Bạn không có quyền tạo thanh toán cho đặt vé này.')
    }

    if (
        bookingInfo.bookingType === BookingType.enum.round_trip &&
        method === PaymentMethod.enum.cash
    ) {
        throw new HttpErr.UnprocessableEntity(
            'Đặt vé khứ hồi chỉ hỗ trợ thanh toán qua VNPay hoặc Thẻ.',
            'ROUND_TRIP_CASH_PAYMENT_NOT_ALLOWED'
        )
    }

    if (couponId) {
        await applyCouponToPendingBooking(bookingId, couponId)
    }

    switch (method) {
        case PaymentMethod.enum.vnpay:
            return createVnpayPayment(params, ip)
        case PaymentMethod.enum.cash:
            return createCashPayment(params, bookingId)
        case PaymentMethod.enum.stripe:
            return createStripePayment(params, userId)
        default:
            throw new HttpErr.UnprocessableEntity(
                'Phương thức thanh toán không hợp lệ.',
                'INVALID_PAYMENT_METHOD'
            )
    }
}

export async function createCashPayment(params: PaymentMethodRequest, _bookingId?: BookingId) {
    const payment = await db.transaction().execute(async tx => {
        const result = await preparePayment(params.id, PaymentMethod.enum.cash, tx)
        await dal.booking.booking.cmd.updateExpiredBooking(params.id, tx)
        return result
    })

    return {
        message: 'Vui lòng thanh toán khi lên xe.',
        payment,
    }
}

export async function createVnpayPayment(params: PaymentMethodRequest, ip: string) {
    const payment = await preparePayment(params.id, PaymentMethod.enum.vnpay)

    const amt = payment.totalAmount
    const txCode = payment.transactionCode ?? ''
    return {
        message: 'Thành công',
        paymentUrl: service.vnpay.init.initiatePayment(amt, txCode, ip),
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
        const payment = await dal.booking.booking.query.getPayment(undefined, vnp_TxnRef, tx)

        if (!payment) {
            return { RspCode: '01', Message: 'Không tìm thấy thanh toán' }
        }

        if (payment.status === PaymentStatus.enum.success) {
            return { RspCode: '00', Message: 'Thanh toán đã được xác nhận' }
        }

        if (payment.totalAmount !== Number(vnp_Amount) / 100) {
            return { RspCode: '04', Message: 'Số tiền thanh toán không hợp lệ' }
        }

        if (vnp_ResponseCode !== '00') {
            await dal.booking.booking.cmd.updatePaymentStatusFailed(vnp_TxnRef, tx)
            return { RspCode: '24', Message: 'Thanh toán thất bại' }
        }

        await dal.booking.booking.cmd.updatePaymentStatusSuccess(
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

export async function getRevenueByCompanyId(companyId: OrganizationBusCompanyId) {
    return dal.booking.booking.query.getTotalRevenueByCompanyId(companyId)
}

export async function updateByTransactionCode(
    transactionCode: string,
    companyId: OrganizationBusCompanyId
) {
    return dal.booking.booking.cmd.updatePaymentByTransactionCode(transactionCode, companyId)
}

export async function getPeriodRevenue(params: PeriodPaymentQuery) {
    const data = await dal.booking.booking.query.getPeriodRevenue(params)
    return { data: data }
}

export async function exportCompanyRevenueExcel(params: RevenueExportQuery) {
    const year = params.year ?? utils.time.getNow().year()
    const meta = { year, method: params.method }
    if (params.type === 'monthly') {
        const rows = await dal.booking.booking.query.getRevenueByCompanyMonthlyForPeriod(params)
        return service.excel.buildCompanyRevenueMonthlySheet(rows, meta)
    }
    const rows = await dal.booking.booking.query.getRevenueByCompanyYearlyForPeriod(params)
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
    const payment = await db.transaction().execute(async tx => {
        await dal.booking.booking.query.lockBookingForPayment(params.id, tx)
        return preparePayment(params.id, PaymentMethod.enum.stripe, tx)
    })

    const user = await dal.auth.user.query.getOne({ id: userId })
    if (!user?.accountStripeId) {
        throw new HttpErr.UnprocessableEntity(
            'Không tìm thấy tài khoản Stripe của khách hàng.',
            'CUSTOMER_STRIPE_NOT_FOUND'
        )
    }

    const companyAdmin = await dal.auth.user.query.getCompanyStripeAccountId(payment.companyId)

    if (!companyAdmin?.accountStripeId) {
        throw new HttpErr.UnprocessableEntity(
            'Hiện tại công ty chưa cho phép thanh toán qua thẻ.',
            'COMPANY_STRIPE_NOT_LINKED'
        )
    }

    const txCode = payment.transactionCode ?? ''
    const amt = payment.totalAmount
    const successUrl = buildStripePaymentReturnUrl('success', txCode)
    const cancelUrl = buildStripePaymentReturnUrl('cancelled', txCode)

    const [paymentIntent, checkoutSession] = await Promise.all([
        service.stripe.client.createPaymentIntentWithCommission({
            amount: amt,
            stripeCustomerId: user.accountStripeId,
            companyAdminStripeId: companyAdmin.accountStripeId,
            transactionCode: txCode,
        }),
        service.stripe.client.createCheckoutSessionWithCommission({
            amount: amt,
            stripeCustomerId: user.accountStripeId,
            companyAdminStripeId: companyAdmin.accountStripeId,
            transactionCode: txCode,
            successUrl,
            cancelUrl,
        }),
    ])

    if (!checkoutSession.url) {
        throw new HttpErr.BadRequest(
            'Không tạo được URL thanh toán Stripe.',
            'STRIPE_PAYMENT_URL_NOT_CREATED'
        )
    }

    return {
        message: 'Thành công',
        paymentUrl: checkoutSession.url,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        payment: payment,
    }
}
