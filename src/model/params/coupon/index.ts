import z from 'zod'
export const CouponIdParam = z.object({})

export type CouponIdParam = z.infer<typeof CouponIdParam>
