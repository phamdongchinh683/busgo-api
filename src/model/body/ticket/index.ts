import z from 'zod'
import { BookingTicketId } from '../../../database/booking/ticket/type.js'
import { PaymentStatus, BookingType, BookingId } from '../../../database/booking/booking/type.js'
import { OrganizationVehicleType } from '../../../database/organization/vehicle/type.js'
import { OperationTripStatus } from '../../../database/operation/trip/type.js'

export const TicketBody = z.object({
    status: PaymentStatus.nullable(),
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

export const TicketResponse = z.object({
    ticket: z.object({
        id: BookingTicketId,
        status: PaymentStatus.nullable(),
        code: z.string().nullable(),
        bookingType: BookingType.nullable(),
        originalAmount: z.number().nullable(),
        discountAmount: z.number().nullable(),
        totalAmount: z.number().nullable(),
        departureDate: z.date().nullable(),
        isRated: z.boolean(),
        seatNumber: z.string().nullable(),
        plateNumber: z.string().nullable(),
        type: OrganizationVehicleType.nullable(),
        fromLocation: z.string().nullable(),
        toLocation: z.string().nullable(),
        departureTime: z.string().nullable(),
    }),
})

export type TicketResponse = z.infer<typeof TicketResponse>

export const TicketCheckInResponse = z.object({
    message: z.string(),
    ticket: z.object({}).optional(),
})
export type TicketCheckInResponse = z.infer<typeof TicketCheckInResponse>

export const TicketSupportResponse = z.object({
    ticket: z.object({
        id: BookingTicketId,
        status: PaymentStatus.nullable(),
        code: z.string(),
        bookingType: BookingType,
        originalAmount: z.number(),
        discountAmount: z.number(),
        totalAmount: z.number(),
        departureDate: z.date(),
        isRated: z.boolean(),
    }),
})

export type TicketSupportResponse = z.infer<typeof TicketSupportResponse>
