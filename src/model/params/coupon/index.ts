import { BookingCouponPublicId } from '../../../database/booking/coupon/type.js'
import z from 'zod'
export const CouponIdParam = z.object({
    id: BookingCouponPublicId,
})

export type CouponIdParam = z.infer<typeof CouponIdParam>
