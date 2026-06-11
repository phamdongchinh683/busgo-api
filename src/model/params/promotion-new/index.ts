import { BookingPromotionNewsPublicId } from '../../../database/booking/promotion_new/type.js'
import z from 'zod'

export const PromotionNewsIdParam = z.object({
    id: BookingPromotionNewsPublicId,
})

export type PromotionNewsIdParam = z.infer<typeof PromotionNewsIdParam>
