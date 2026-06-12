import z from 'zod'
import {
    OperationTripId,
    OperationTripPublicId,
    OperationTripStatus,
} from '../../../database/operation/trip/type.js'
import {
    OrganizationVehicleId,
    OrganizationVehiclePublicId,
    OrganizationVehicleType,
} from '../../../database/organization/vehicle/type.js'
import {
    OrganizationSeatId,
    OrganizationSeatPublicId,
    OrganizationSeatType,
} from '../../../database/organization/seat/type.js'
import {
    OperationStationId,
    OperationStationPublicId,
} from '../../../database/operation/station/type.js'
import {
    OperationTripScheduleId,
    OperationTripSchedulePublicId,
} from '../../../database/operation/trip-schedule/type.js'
import {
    BookingTicketId,
    BookingTicketPublicId,
    BookingTicketStatus,
} from '../../../database/booking/ticket/type.js'
import { BookingStatus, BookingType } from '../../../database/booking/booking/type.js'
import { OperationRouteId, OperationRoutePublicId } from '../../../database/operation/route/type.js'
import { AuthUserId, AuthUserPublicId } from '../../../database/auth/user/type.js'
import {
    OrganizationBusCompanyId,
    OrganizationBusCompanyPublicId,
} from '../../../database/organization/bus_company/type.js'

export const TripItem = z.object({
    id: OperationTripPublicId,
    routeId: OperationRouteId.optional(),
    vehicleId: OrganizationVehicleId.optional(),
    driverIds: z.array(AuthUserId).nullable().optional(),
    scheduleId: OperationTripScheduleId.optional(),
    departureDate: z.coerce.date().optional(),
    status: OperationTripStatus.optional(),
})

export type TripItem = z.infer<typeof TripItem>

export const TripRequestItem = TripItem.extend({
    routeId: OperationRoutePublicId.optional(),
    vehicleId: OrganizationVehiclePublicId.nullable().optional(),
    driverIds: z.array(AuthUserPublicId).nullable().optional(),
    scheduleId: OperationTripSchedulePublicId.optional(),
})

export type TripRequestItem = z.infer<typeof TripRequestItem>

export const TripResponse = z.object({
    trips: z.array(
        z.object({
            id: OperationTripPublicId,
            fromLocation: z.string(),
            toLocation: z.string(),
            distanceKm: z.number(),
            durationMinutes: z.number(),
            companyName: z.string(),
            logoUrl: z.string(),
            plateNumber: z.string(),
            driverIds: z.array(AuthUserPublicId).nullable(),
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
            stationId: OperationStationPublicId,
            stopOrder: z.number(),
            price: z.number(),
        })
    ),
})

export type TripStopResponse = z.infer<typeof TripStopResponse>

export const TripStopPickUpItem = z.object({
    address: z.string(),
    city: z.string(),
    stationId: OperationStationPublicId,
    stopOrder: z.number(),
})

export type TripStopPickUpItem = z.infer<typeof TripStopPickUpItem>

export const TripStopPickupResponse = z.object({
    tripStops: z.array(TripStopPickUpItem),
})

export type TripStopPickupResponse = z.infer<typeof TripStopPickupResponse>

export const TripSeatResponse = z.object({
    seats: z.array(
        z.object({
            id: OrganizationSeatPublicId,
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

export const TripRequestBody = TripBody.extend({
    scheduleId: OperationTripSchedulePublicId,
    companyId: OrganizationBusCompanyPublicId,
})

export type TripRequestBody = z.infer<typeof TripRequestBody>

export const TripPrepareResponse = z.object({
    id: OperationTripPublicId,
    companyId: OrganizationBusCompanyPublicId,
})

export type TripPrepareResponse = z.infer<typeof TripPrepareResponse>

export const DriverTripBody = z.object({
    trips: z.array(
        z.object({
            id: OperationTripPublicId,
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
            id: BookingTicketPublicId,
            fullName: z.string(),
            phoneNumber: z.string().nullable(),
            seatNumber: z.string().nullable(),
            status: BookingStatus,
            ticketStatus: BookingTicketStatus,
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
    id: OperationTripPublicId,
    status: OperationTripStatus,
})

export type TripUpdateStatusResponse = z.infer<typeof TripUpdateStatusResponse>

export const TripUpdateBody = TripItem.omit({ id: true })

export type TripUpdateBody = z.infer<typeof TripUpdateBody>

export const TripUpdateRequestBody = TripRequestItem.omit({ id: true })

export type TripUpdateRequestBody = z.infer<typeof TripUpdateRequestBody>

export const TripUpdateResponse = z.object({
    trip: TripRequestItem,
})

export type TripUpdateResponse = z.infer<typeof TripUpdateResponse>
