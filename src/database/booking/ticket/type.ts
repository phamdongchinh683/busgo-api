import { z } from 'zod'

export const BookingTicketId = z.coerce.number().brand<'booking.ticket.id'>()
export type BookingTicketId = z.infer<typeof BookingTicketId>

export const BookingTicketPublicId = z.uuid().brand<'booking.ticket.public_id'>()
export type BookingTicketPublicId = z.infer<typeof BookingTicketPublicId>

export const BookingTicketStatus = z.enum(['reserved', 'paid', 'cancelled', 'checked_in'])
export type BookingTicketStatus = z.infer<typeof BookingTicketStatus>
