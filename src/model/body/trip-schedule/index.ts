import z from 'zod'
import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { StatusFlag } from '../../common.js'
import { OperationRouteId } from '../../../database/operation/route/type.js'

export const TripScheduleItemResponse = z.object({
    departureTime: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: StatusFlag,
})

export type TripScheduleItemResponse = z.infer<typeof TripScheduleItemResponse>

export const TripScheduleResponse = z.object({
    trip: z.array(
        z.object({
            departureTime: z.string(),
            name: z.string(),
            logoUrl: z.string(),
            hotline: z.string(),
            fromLocation: z.string(),
            toLocation: z.string(),
            distanceKm: z.number(),
            startDate: z.coerce.date(),
            endDate: z.coerce.date(),
            status: StatusFlag,
            durationMinutes: z.number(),
            totalStars: z.number().min(0).max(5),
        })
    ),
    next: OperationTripScheduleId.nullable(),
})

export type TripScheduleResponse = z.infer<typeof TripScheduleResponse>

export const TripScheduleUpdateResponse = z.object({
    tripSchedule: TripScheduleItemResponse,
})

export type TripScheduleUpdateResponse = z.infer<typeof TripScheduleUpdateResponse>

export const TripScheduleBody = z.object({
    routeId: OperationRouteId,
    companyId: OrganizationBusCompanyId,
    departureTime: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: StatusFlag,
})

export const TripScheduleUpdateBody = z.object({
    departureTime: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    status: StatusFlag.optional(),
})

export type TripScheduleUpdateBody = z.infer<typeof TripScheduleUpdateBody>

export type TripScheduleBody = z.infer<typeof TripScheduleBody>

export const TripScheduleRequestBody = TripScheduleBody.extend({})

export type TripScheduleRequestBody = z.infer<typeof TripScheduleRequestBody>
