import {
    BookingCouponId,
    BookingCouponPublicId,
    BookingDiscountType,
} from '../../../database/booking/coupon/type.js'
import z from 'zod'
import { PublicApiId } from '../../public-id.js'

export const CouponResponse = z.object({
    id: PublicApiId(BookingCouponPublicId, BookingCouponId),
    code: z.string(),
    discountType: BookingDiscountType,
    discountValue: z.number(),
    minOrderAmount: z.number(),
    maxDiscountAmount: z.number(),
    totalQuantity: z.number(),
    usedQuantity: z.number(),
    startDate: z.date().nullable(),
    endDate: z.date().nullable(),
    isActive: z.boolean(),
})

export type CouponResponse = z.infer<typeof CouponResponse>

export const CouponsResponse = z.object({
    coupons: z.array(CouponResponse),
    next: BookingCouponId.nullable(),
})

export type CouponsResponse = z.infer<typeof CouponsResponse>

export const CouponApplyResponse = z.object({
    id: PublicApiId(BookingCouponPublicId, BookingCouponId),
    discountAmount: z.number(),
    finalTotal: z.number(),
})

export type CouponApplyResponse = z.infer<typeof CouponApplyResponse>

export const CouponCreateResponse = z.object({
    coupon: CouponResponse,
})

export type CouponCreateResponse = z.infer<typeof CouponCreateResponse>
