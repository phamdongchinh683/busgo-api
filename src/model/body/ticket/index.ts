import z from 'zod'
import { BookingTicketId, TicketStatus } from '../../../database/booking/ticket/type.js'
import { PaymentStatus, BookingType, BookingId } from '../../../database/booking/booking/type.js'
import { OperationTripStatus } from '../../../database/operation/trip/type.js'

export const TicketBody = z.object({
    status: PaymentStatus,
    isRate: z.boolean(),
    bookingType: BookingType,
    originalAmount: z.number(),
    discountAmount: z.number(),
    totalAmount: z.number(),
    departureDate: z.date(),
})

export type TicketBody = z.infer<typeof TicketBody>

export const TicketCancelResponse = z.object({
    message: z.string(),
    tickets: z.array(z.object({ id: BookingTicketId })).optional(),
})
export type TicketCancelResponse = z.infer<typeof TicketCancelResponse>

export const TicketsResponse = z.object({
    tickets: z.array(
        TicketBody.extend({
            id: BookingTicketId,
            bookingId: BookingId,
            name: z.string(),
            from: z.string(),
            to: z.string(),
            departureDate: z.date(),
            tripStatus: OperationTripStatus,
            expiredAt: z.date().nullable(),
        })
    ),
    next: BookingTicketId.nullable(),
})

export type TicketsResponse = z.infer<typeof TicketsResponse>

export const TicketSupportResponse = z.object({
    tickets: z.array(
        z.object({
            id: BookingTicketId,
            bookingId: BookingId,
            code: z.string(),
            originalAmount: z.number(),
            discountAmount: z.number(),
            totalAmount: z.number(),
            from: z.string(),
            to: z.string(),
            departureDate: z.date(),
            tripStatus: OperationTripStatus,
            expiredAt: z.date().nullable(),
        })
    ),
    next: BookingTicketId.nullable(),
})

export type TicketSupportResponse = z.infer<typeof TicketSupportResponse>

export const TicketCheckInBody = z.object({
    id: BookingTicketId,
    status: TicketStatus,
})

export type TicketCheckInBody = z.infer<typeof TicketCheckInBody>

export const TicketCheckInResponse = z.object({
    id: BookingTicketId,
    status: TicketStatus,
    checkedInAt: z.date().nullable(),
})

export type TicketCheckInResponse = z.infer<typeof TicketCheckInResponse>
