import { z } from 'zod'

export const BookingPromotionNewsId = z.coerce.number().brand<'booking.promotion_new.id'>()
export type BookingPromotionNewsId = z.infer<typeof BookingPromotionNewsId>

export const BookingPromotionNewsPublicId = z.uuid().brand<'booking.promotion_new.public_id'>()
export type BookingPromotionNewsPublicId = z.infer<typeof BookingPromotionNewsPublicId>
