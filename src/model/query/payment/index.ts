import z from 'zod'
import { BookingId, PaymentMethod, PaymentStatus } from '../../../database/booking/booking/type.js'
import { PeriodFilter } from '../../common.js'
import { BookingCouponId } from '../../../database/booking/coupon/type.js'

export const PaymentTransactionCodeParam = z.object({
    code: z.string(),
})

export type PaymentTransactionCodeParam = z.infer<typeof PaymentTransactionCodeParam>

export const PaymentMethodRequest = z.object({
    id: BookingId,
    couponId: BookingCouponId.optional(),
    method: PaymentMethod,
})

export type PaymentMethodRequest = z.infer<typeof PaymentMethodRequest>

export const VnPayIpnRequest = z.object({
    vnp_TmnCode: z.string(),
    vnp_Amount: z.string(),
    vnp_OrderInfo: z.string(),
    vnp_TxnRef: z.string(),
    vnp_BankCode: z.string(),
    vnp_BankTranNo: z.string().optional(),
    vnp_CardType: z.string(),
    vnp_TransactionType: z.string().optional(),
    vnp_TransactionDate: z.string().optional(),
    vnp_TransactionNo: z.string(),
    vnp_TransactionStatus: z.string().optional(),
    vnp_SecureHash: z.string(),
    vnp_PayDate: z.string(),
    vnp_ResponseCode: z.string(),
})

export type VnPayIpnRequest = z.infer<typeof VnPayIpnRequest>

export const PeriodPaymentQuery = PeriodFilter.extend({
    method: PaymentMethod.optional(),
    status: PaymentStatus.optional(),
})

export type PeriodPaymentQuery = z.infer<typeof PeriodPaymentQuery>

/** Super-admin revenue export: month/year breakdown, one payment method, successful payments only. */
export const RevenueExportQuery = PeriodFilter.extend({
    method: PaymentMethod,
})

export type RevenueExportQuery = z.infer<typeof RevenueExportQuery>
