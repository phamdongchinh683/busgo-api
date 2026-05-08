import { BookingPromotionNewsId } from '../../../database/booking/promotion_new/type.js'
import z from 'zod'

export const PromotionNewsIdParam = z.object({
    id: BookingPromotionNewsId,
})

export type PromotionNewsIdParam = z.infer<typeof PromotionNewsIdParam>
