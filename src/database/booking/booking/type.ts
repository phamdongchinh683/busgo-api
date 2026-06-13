import { z } from 'zod'

export const BookingId = z.coerce.number().brand<'booking.booking.id'>()
export type BookingId = z.infer<typeof BookingId>

export const BookingType = z.enum(['one_way', 'round_trip'])
export type BookingType = z.infer<typeof BookingType>

export const BookingStatus = z.enum(['pending', 'paid', 'cancelled', 'expired'])
export type BookingStatus = z.infer<typeof BookingStatus>

export const PaymentMethod = z.enum(['vnpay', 'cash', 'stripe'])
export type PaymentMethod = z.infer<typeof PaymentMethod>

export const PaymentStatus = z.enum(['pending', 'success', 'failed', 'refunded'])
export type PaymentStatus = z.infer<typeof PaymentStatus>
