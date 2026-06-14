import z from 'zod'
import { OperationTripId, OperationTripStatus } from '../../../database/operation/trip/type.js'
import {
    OrganizationVehicleId,
    OrganizationVehicleType,
} from '../../../database/organization/vehicle/type.js'
import { OrganizationSeatType } from '../../../database/organization/seat/type.js'
import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'
import { OperationRouteId } from '../../../database/operation/route/type.js'
import { BookingTicketId } from '../../../database/booking/ticket/type.js'
import { PaymentStatus, BookingType } from '../../../database/booking/booking/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { AuthUserId } from '../../../database/auth/user/type.js'
import { OperationStationId } from '../../../database/operation/station/type.js'

export const TripItem = z.object({
    routeId: OperationRouteId.optional(),
    vehicleId: OrganizationVehicleId.optional(),
    driverIds: z.array(AuthUserId).nullable().optional(),
    scheduleId: OperationTripScheduleId.optional(),
    departureDate: z.coerce.date().optional(),
    status: OperationTripStatus.optional(),
})

export type TripItem = z.infer<typeof TripItem>

export const TripRequestItem = TripItem.extend({})

export type TripRequestItem = z.infer<typeof TripRequestItem>

export const TripResponse = z.object({
    trips: z.array(
        z.object({
            fromLocation: z.string(),
            toLocation: z.string(),
            distanceKm: z.number(),
            durationMinutes: z.number(),
            companyName: z.string(),
            logoUrl: z.string(),
            plateNumber: z.string(),
            type: OrganizationVehicleType,
            totalSeats: z.number(),
            status: OperationTripStatus,
        })
    ),
    next: OperationTripId.nullable(),
})

export type TripResponse = z.infer<typeof TripResponse>

export const TripStopResponse = z.object({
    tripStops: z.array(
        z.object({
            address: z.string(),
            city: z.string(),
            stopOrder: z.number(),
            price: z.number(),
            stationId: OperationStationId,
        })
    ),
})

export type TripStopResponse = z.infer<typeof TripStopResponse>

export const TripStopPickUpItem = z.object({
    address: z.string(),
    city: z.string(),
    stopOrder: z.number(),
    stationId: OperationStationId,
})

export type TripStopPickUpItem = z.infer<typeof TripStopPickUpItem>

export const TripStopPickupResponse = z.object({
    tripStops: z.array(TripStopPickUpItem),
})

export type TripStopPickupResponse = z.infer<typeof TripStopPickupResponse>

export const TripSeatResponse = z.object({
    seats: z.array(
        z.object({
            seatNumber: z.string(),
            type: OrganizationSeatType,
            isAvailable: z.boolean(),
        })
    ),
})

export type TripSeatResponse = z.infer<typeof TripSeatResponse>

export const TripBody = z.object({
    scheduleId: OperationTripScheduleId,
    companyId: OrganizationBusCompanyId,
    departureDate: z.coerce.date().refine(
        value => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const input = new Date(value)
            input.setHours(0, 0, 0, 0)

            return input >= today
        },
        {
            message: 'Ngày khởi hành phải là hôm nay hoặc một ngày trong tương lai.',
        }
    ),
})

export type TripBody = z.infer<typeof TripBody>

export const TripRequestBody = TripBody.extend({})

export type TripRequestBody = z.infer<typeof TripRequestBody>

export const TripPrepareResponse = z.object({
    id: OperationTripId,
    companyId: OrganizationBusCompanyId,
})

export type TripPrepareResponse = z.infer<typeof TripPrepareResponse>

export const DriverTripBody = z.object({
    trips: z.array(
        z.object({
            type: OrganizationVehicleType,
            totalSeats: z.number(),
            fromLocation: z.string(),
            toLocation: z.string(),
            distanceKm: z.number(),
            durationMinutes: z.number(),
            plateNumber: z.string(),
            departureTime: z.string(),
            departureDate: z.coerce.date(),
            status: OperationTripStatus,
        })
    ),
    next: OperationTripId.nullable(),
})

export type DriverTripBody = z.infer<typeof DriverTripBody>

export const TripPassengerResponse = z.object({
    passengers: z.array(
        z.object({
            firstName: z.string(),
            lastName: z.string(),
            phoneNumber: z.string().nullable(),
            seatNumber: z.string().nullable(),
            status: PaymentStatus,
            checkedInAt: z.date().nullable(),
            pickup: z.string().nullable(),
            bookingType: BookingType,
            totalAmount: z.number(),
            dropoff: z.string().nullable(),
        })
    ),
    next: BookingTicketId.nullable(),
})

export type TripPassengerResponse = z.infer<typeof TripPassengerResponse>

export const TripUpdateStatusBody = z.object({
    status: OperationTripStatus,
})

export type TripUpdateStatusBody = z.infer<typeof TripUpdateStatusBody>

export const TripUpdateStatusResponse = z.object({
    status: OperationTripStatus,
})

export type TripUpdateStatusResponse = z.infer<typeof TripUpdateStatusResponse>

export const TripUpdateBody = TripItem

export type TripUpdateBody = z.infer<typeof TripUpdateBody>

export const TripUpdateRequestBody = TripRequestItem

export type TripUpdateRequestBody = z.infer<typeof TripUpdateRequestBody>

export const TripUpdateResponse = z.object({
    trip: TripRequestItem,
})

export type TripUpdateResponse = z.infer<typeof TripUpdateResponse>
