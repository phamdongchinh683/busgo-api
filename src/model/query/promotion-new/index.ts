import z from 'zod'
import { BookingPromotionNewsId } from '../../../database/booking/promotion_new/type.js'

export const PromotionNewsListQuery = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: z.boolean().optional().default(true),
    next: BookingPromotionNewsId.optional().nullable(),
})

export type PromotionNewsListQuery = z.infer<typeof PromotionNewsListQuery>
