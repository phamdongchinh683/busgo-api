import { z } from 'zod'

export const BookingPromotionNewsId = z.coerce.number().brand<'booking.promotion_new.id'>()
export type BookingPromotionNewsId = z.infer<typeof BookingPromotionNewsId>
