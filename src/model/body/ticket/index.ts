import z from 'zod'
import { BookingTicketId, BookingTicketStatus } from '../../../database/booking/ticket/type.js'
import { BookingId, BookingStatus, BookingType } from '../../../database/booking/booking/type.js'
import { OrganizationVehicleType } from '../../../database/organization/vehicle/type.js'
import { OperationTripId, OperationTripStatus } from '../../../database/operation/trip/type.js'

export const TicketBody = z.object({
    id: BookingTicketId,
    status: BookingStatus,
    bookingType: BookingType,
    originalAmount: z.number(),
    discountAmount: z.number(),
    totalAmount: z.number(),
    departureDate: z.date(),
})

export type TicketBody = z.infer<typeof TicketBody>

export const TicketCancelResponse = z.object({
    message: z.string(),
    tickets: z.array(
        z.object({
            id: BookingTicketId,
            status: BookingTicketStatus,
        })
    ),
})
export type TicketCancelResponse = z.infer<typeof TicketCancelResponse>

export const TicketsResponse = z.object({
    tickets: z.array(
        TicketBody.extend({
            bookingId: BookingId,
            departureDate: z.date().nullable(),
            tripId: OperationTripId.nullable(),
            tripStatus: OperationTripStatus.nullable(),
            expiredAt: z.date().nullable(),
        })
    ),
    next: BookingTicketId.nullable(),
})

export type TicketsResponse = z.infer<typeof TicketsResponse>

export const TicketResponse = z.object({
    ticket: z.object({
        id: BookingTicketId,
        status: BookingStatus.nullable(),
        code: z.string().nullable(),
        bookingType: BookingType.nullable(),
        originalAmount: z.number().nullable(),
        discountAmount: z.number().nullable(),
        totalAmount: z.number().nullable(),
        departureDate: z.date().nullable(),
        seatNumber: z.string().nullable(),
        plateNumber: z.string().nullable(),
        type: OrganizationVehicleType.nullable(),
        fromLocation: z.string().nullable(),
        toLocation: z.string().nullable(),
        departureTime: z.string().nullable(),
    }),
})

export type TicketResponse = z.infer<typeof TicketResponse>

export const TicketStatusBody = z.object({
    ticketStatus: BookingTicketStatus,
})

export type TicketStatusBody = z.infer<typeof TicketStatusBody>

export const TicketCheckInResponse = z.object({
    message: z.string(),
    ticket: z.object({
        id: BookingTicketId,
        status: BookingTicketStatus,
    }),
})
export type TicketCheckInResponse = z.infer<typeof TicketCheckInResponse>

export const TicketSupportResponse = z.object({
    ticket: z.object({
        id: BookingTicketId,
        status: BookingStatus,
        code: z.string(),
        bookingType: BookingType,
        originalAmount: z.number(),
        discountAmount: z.number(),
        totalAmount: z.number(),
        departureDate: z.date(),
    }),
})

export type TicketSupportResponse = z.infer<typeof TicketSupportResponse>
