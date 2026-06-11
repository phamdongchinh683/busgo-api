import { BookingTicketPublicId } from '../../../database/booking/ticket/type.js'
import z from 'zod'

export const TicketIdParam = z.object({
    id: BookingTicketPublicId,
})

export type TicketIdParam = z.infer<typeof TicketIdParam>
