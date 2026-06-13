import { BookingTicketId } from '../../../database/booking/ticket/type.js'
import z from 'zod'

export const TicketIdParam = z.object({
    id: BookingTicketId,
})

export type TicketIdParam = z.infer<typeof TicketIdParam>
