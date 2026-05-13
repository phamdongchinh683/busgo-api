import z from 'zod'
import { BookingPromotionNewsId } from '../../../database/booking/promotion_new/type.js'

const PromotionNewsStatusQuery = z.preprocess(
    value => {
        if (value === true || value === 'true') return 'true'
        if (value === false || value === 'false') return 'false'
        return value
    },
    z.enum(['true', 'false'])
)

export const PromotionNewsListQuery = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(10),
    status: PromotionNewsStatusQuery.optional(),
    next: BookingPromotionNewsId.optional().nullable(),
})

export type PromotionNewsListQuery = z.infer<typeof PromotionNewsListQuery>
