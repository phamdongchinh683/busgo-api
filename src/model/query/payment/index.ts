import z from 'zod'
import { BookingId } from '../../../database/booking/booking/type.js'
import { PaymentId, PaymentMethod, PaymentStatus } from '../../../database/payment/payment/type.js'
import { PeriodFilter } from '../../common.js'

export const PaymentIdParam = z.object({
    id: PaymentId,
})

export type PaymentIdParam = z.infer<typeof PaymentIdParam>

export const PaymentTransactionCodeParam = z.object({
    code: z.string(),
})

export type PaymentTransactionCodeParam = z.infer<typeof PaymentTransactionCodeParam>

export const PaymentMethodRequest = z.object({
    id: BookingId,
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
    vnp_TransactionStatus: z.string(),
    vnp_SecureHash: z.string(),
    vnp_PayDate: z.string(),
    vnp_ResponseCode: z.string(),
})

export type VnPayIpnRequest = z.infer<typeof VnPayIpnRequest>

export const PaymentFilter = z.object({
    transactionCode: z.string().optional(),
    status: PaymentStatus.optional(),
    method: PaymentMethod.optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    next: PaymentId.optional(),
})

export type PaymentFilter = z.infer<typeof PaymentFilter>

export const PaymentResponse = z.object({
    id: PaymentId,
    bookingId: BookingId,
    amount: z.number(),
    method: PaymentMethod.nullable(),
    status: PaymentStatus,
    transactionCode: z.string(),
    paidAt: z.date().nullable(),
    expiredAt: z.date().nullable(),
})

export type PaymentResponse = z.infer<typeof PaymentResponse>

export const PaymentListResponse = z.object({
    payments: z.array(
        PaymentResponse.extend({
            phone: z.string(),
        })
    ),
    next: PaymentId.nullable(),
})

export type PaymentListResponse = z.infer<typeof PaymentListResponse>

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
