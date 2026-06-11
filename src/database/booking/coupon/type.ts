import { z } from 'zod'

export const BookingCouponId = z.coerce.number().brand<'booking.coupon.id'>()
export type BookingCouponId = z.infer<typeof BookingCouponId>

export const BookingCouponPublicId = z.uuid().brand<'booking.coupon.public_id'>()
export type BookingCouponPublicId = z.infer<typeof BookingCouponPublicId>

export const BookingDiscountType = z.enum(['percent', 'fixed'])
export type BookingDiscountType = z.infer<typeof BookingDiscountType>
