import z from 'zod'
import { BookingPromotionNewsId } from '../../../database/booking/promotion_new/type.js'

export const PromotionNewsBody = z.object({
    title: z.string().trim().min(1).max(255),
    content: z.string().trim().min(1),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional().default(true),
    startDate: z.string().min(5).max(5).optional().nullable(),
    endDate: z.string().min(5).max(5).optional().nullable(),
})

export type PromotionNewsBody = z.infer<typeof PromotionNewsBody>

export const PromotionNewsListResponse = z.object({
    items: z.array(
        PromotionNewsBody.extend({
            id: BookingPromotionNewsId,
        })
    ),
    next: BookingPromotionNewsId.nullable(),
})

export type PromotionNewsListResponse = z.infer<typeof PromotionNewsListResponse>

export const PromotionNewsCreateResponse = z.object({
    item: PromotionNewsBody.extend({
        id: BookingPromotionNewsId,
    }),
})

export type PromotionNewsCreateResponse = z.infer<typeof PromotionNewsCreateResponse>
