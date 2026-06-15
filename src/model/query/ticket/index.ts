import { BookingTicketId } from '../../../database/booking/ticket/type.js'
import z from 'zod'
import { PaymentStatus, BookingType } from '../../../database/booking/booking/type.js'
import { Phone } from '../../common.js'

export const TicketFilter = z.object({
    limit: z.coerce.number().optional().default(10),
    next: BookingTicketId.optional(),
    type: BookingType.optional(),
    status: PaymentStatus.optional(),
})

export type TicketFilter = z.infer<typeof TicketFilter>

export const PassengerTicketFilter = z.object({
    limit: z.coerce.number().optional().default(10),
    next: BookingTicketId.optional(),
    phone: Phone.optional(),
})

export type PassengerTicketFilter = z.infer<typeof PassengerTicketFilter>

export const PassengerCheckInParam = z.object({})
export type PassengerCheckInParam = z.infer<typeof PassengerCheckInParam>

export const TicketSupportFilter = TicketFilter.extend({
    code: z.string().optional(),
})

export type TicketSupportFilter = z.infer<typeof TicketSupportFilter>
