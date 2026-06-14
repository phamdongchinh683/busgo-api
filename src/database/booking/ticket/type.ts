import { z } from 'zod'

export const BookingTicketId = z.coerce.number().brand<'booking.ticket.id'>()
export type BookingTicketId = z.infer<typeof BookingTicketId>

export const TicketStatus = z.enum(['active', 'checked_in', 'completed', 'cancelled'])
export type TicketStatus = z.infer<typeof TicketStatus>
