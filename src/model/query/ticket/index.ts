import { BookingTicketId, BookingTicketStatus } from '../../../database/booking/ticket/type.js'
import z from 'zod'
import { BookingType } from '../../../database/booking/booking/type.js'
import { OperationTripId } from '../../../database/operation/trip/type.js'
import { Phone } from '../../common.js'

export const TicketFilter = z.object({
    limit: z.coerce.number().optional().default(10),
    next: BookingTicketId.optional(),
    type: BookingType.optional(),
    status: BookingTicketStatus.optional(),
})

export type TicketFilter = z.infer<typeof TicketFilter>

export const PassengerTicketFilter = z.object({
    limit: z.coerce.number().optional().default(10),
    next: BookingTicketId.optional(),
    phoneNumber: Phone.optional(),
})

export type PassengerTicketFilter = z.infer<typeof PassengerTicketFilter>

export const PassengerCheckInParam = z.object({
    id: OperationTripId.optional(),
    passengerId: BookingTicketId,
})
export type PassengerCheckInParam = z.infer<typeof PassengerCheckInParam>

export const TicketSupportFilter = TicketFilter.extend({
    code: z.string().optional(),
})

export type TicketSupportFilter = z.infer<typeof TicketSupportFilter>
