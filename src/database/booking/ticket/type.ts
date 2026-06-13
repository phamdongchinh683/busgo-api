import { z } from 'zod'

export const BookingTicketId = z.coerce.number().brand<'booking.ticket.id'>()
export type BookingTicketId = z.infer<typeof BookingTicketId>

export const BookingTicketStatus = z.enum(['reserved', 'paid', 'cancelled', 'checked_in'])
export type BookingTicketStatus = z.infer<typeof BookingTicketStatus>
