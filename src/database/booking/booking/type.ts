import { z } from 'zod'

export const BookingId = z.coerce.number().brand<'booking.booking.id'>()
export type BookingId = z.infer<typeof BookingId>

export const BookingPublicId = z.uuid().brand<'booking.booking.public_id'>()
export type BookingPublicId = z.infer<typeof BookingPublicId>

export const BookingType = z.enum(['one_way', 'round_trip'])
export type BookingType = z.infer<typeof BookingType>

export const BookingStatus = z.enum(['pending', 'paid', 'cancelled', 'expired'])
export type BookingStatus = z.infer<typeof BookingStatus>
