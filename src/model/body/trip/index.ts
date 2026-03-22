import z from 'zod'
import { OperationTripId, OperationTripStatus } from '../../../database/operation/trip/type.js'
import {
    OrganizationVehicleId,
    OrganizationVehicleType,
} from '../../../database/organization/vehicle/type.js'
import { OrganizationSeatId } from '../../../database/organization/seat/type.js'
import { OperationStationId } from '../../../database/operation/station/type.js'
import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'
import { BookingTicketId } from '../../../database/booking/ticket/type.js'
import { BookingStatus } from '../../../database/booking/booking/type.js'
import { OperationRouteId } from '../../../database/operation/route/type.js'
import { AuthUserId } from '../../../database/auth/user/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const TripItem = z.object({
    id: OperationTripId,
    routeId: OperationRouteId.optional(),
    vehicleId: OrganizationVehicleId.optional(),
    driverId: AuthUserId.optional(),
    scheduleId: OperationTripScheduleId.optional(),
    departureDate: z.coerce.date().optional(),
    status: OperationTripStatus.optional(),
})

export type TripItem = z.infer<typeof TripItem>

export const TripResponse = z.object({
    trips: z.array(
        z.object({
            id: OperationTripId,
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
            stationId: OperationStationId,
            stopOrder: z.number(),
            price: z.number(),
        })
    ),
})

export type TripStopResponse = z.infer<typeof TripStopResponse>

export const TripStopPickupResponse = z.object({
    tripStops: z.array(
        z.object({
            address: z.string(),
            city: z.string(),
            stopOrder: z.number(),
            stationId: OperationStationId,
        })
    ),
})

export type TripStopPickupResponse = z.infer<typeof TripStopPickupResponse>

export const TripSeatResponse = z.object({
    seats: z.array(
        z.object({
            id: OrganizationSeatId,
            seatNumber: z.string(),
        })
    ),
})

export type TripSeatResponse = z.infer<typeof TripSeatResponse>

export const TripBody = z.object({
    scheduleId: OperationTripScheduleId,
    companyId: OrganizationBusCompanyId,
    departureDate: z.coerce.date(),
})

export type TripBody = z.infer<typeof TripBody>

export const TripPrepareResponse = z.object({
    id: OperationTripId,
    companyId: OrganizationBusCompanyId,
})

export type TripPrepareResponse = z.infer<typeof TripPrepareResponse>

export const DriverTripBody = z.object({
    trips: z.array(
        z.object({
            id: OperationTripId,
            type: OrganizationVehicleType,
            totalSeats: z.number(),
            fromLocation: z.string(),
            toLocation: z.string(),
            distanceKm: z.number(),
            durationMinutes: z.number(),
            plateNumber: z.string(),
            departureTime: z.string(),
            departureDate: z.coerce.date(),
        })
    ),
    next: OperationTripId.nullable(),
})

export type DriverTripBody = z.infer<typeof DriverTripBody>

export const TripPassengerResponse = z.object({
    passengers: z.array(
        z.object({
            id: BookingTicketId,
            fullName: z.string(),
            phoneNumber: z.string(),
            seatNumber: z.string().nullable(),
            status: BookingStatus,
            pickup: z.string().nullable(),
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
    id: OperationTripId,
    status: OperationTripStatus,
})

export type TripUpdateStatusResponse = z.infer<typeof TripUpdateStatusResponse>

export const TripUpdateBody = TripItem.omit({ id: true })

export type TripUpdateBody = z.infer<typeof TripUpdateBody>

export const TripUpdateResponse = z.object({
    trip: TripItem,
})

export type TripUpdateResponse = z.infer<typeof TripUpdateResponse>
