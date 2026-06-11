import { z } from 'zod'

export const PaymentId = z.coerce.number().brand<'payment.payment.id'>()
export type PaymentId = z.infer<typeof PaymentId>

export const PaymentPublicId = z.uuid().brand<'payment.payment.public_id'>()
export type PaymentPublicId = z.infer<typeof PaymentPublicId>

export const PaymentMethod = z.enum(['vnpay', 'cash', 'stripe'])
export type PaymentMethod = z.infer<typeof PaymentMethod>

export const PaymentStatus = z.enum(['pending', 'success', 'failed', 'refunded'])
export type PaymentStatus = z.infer<typeof PaymentStatus>
