import z from 'zod'
import { BookingPromotionNewsId } from '../../../database/booking/promotion_new/type.js'
import { StatusFlag } from '../../common.js'

export const PromotionNewsListQuery = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: StatusFlag.optional(),
    next: BookingPromotionNewsId.optional().nullable(),
})

export type PromotionNewsListQuery = z.infer<typeof PromotionNewsListQuery>
