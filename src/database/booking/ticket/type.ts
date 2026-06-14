import { z } from 'zod'

export const BookingTicketId = z.coerce.number().brand<'booking.ticket.id'>()
export type BookingTicketId = z.infer<typeof BookingTicketId>
