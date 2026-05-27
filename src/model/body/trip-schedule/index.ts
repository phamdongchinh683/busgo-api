import z from 'zod'
import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'
import { OperationRouteId } from '../../../database/operation/route/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

function parseTripScheduleDate(value: unknown) {
    if (typeof value !== 'string') return value

    const trimmed = value.trim()
    const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed)
    if (!match) return trimmed

    const [, dayText, monthText, yearText] = match
    const day = Number(dayText)
    const month = Number(monthText)
    const year = Number(yearText)
    const date = new Date(Date.UTC(year, month - 1, day))

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return new Date(Number.NaN)
    }

    return date
}

const TripScheduleDate = z.preprocess(
    parseTripScheduleDate,
    z.union([z.date(), z.string().trim().min(1), z.number()]).pipe(z.coerce.date())
)

export const TripScheduleItemResponse = z.object({
    id: OperationTripScheduleId,
    routeId: OperationRouteId,
    companyId: OrganizationBusCompanyId,
    departureTime: z.string(),
    startDate: TripScheduleDate,
    endDate: TripScheduleDate,
    status: z.boolean(),
})

export type TripScheduleItemResponse = z.infer<typeof TripScheduleItemResponse>

export const TripScheduleResponse = z.object({
    trip: z.array(
        z.object({
            id: OperationTripScheduleId,
            departureTime: z.string(),
            name: z.string(),
            logoUrl: z.string(),
            hotline: z.string(),
            fromLocation: z.string(),
            toLocation: z.string(),
            distanceKm: z.number(),
            startDate: TripScheduleDate,
            endDate: TripScheduleDate,
            companyId: OrganizationBusCompanyId,
            durationMinutes: z.number(),
            totalStars: z.number().min(0).max(5),
        })
    ),
    next: OperationTripScheduleId.nullable(),
})

export type TripScheduleResponse = z.infer<typeof TripScheduleResponse>

export const TripScheduleUpdateResponse = z.object({
    tripSchedule: TripScheduleItemResponse.omit({ companyId: true, routeId: true }),
})

export type TripScheduleUpdateResponse = z.infer<typeof TripScheduleUpdateResponse>

export const TripScheduleBody = z.object({
    routeId: OperationRouteId,
    companyId: OrganizationBusCompanyId,
    departureTime: z.string(),
    startDate: TripScheduleDate,
    endDate: TripScheduleDate,
    status: z.boolean(),
})

export const TripScheduleUpdateBody = z.object({
    departureTime: z.string().optional(),
    startDate: TripScheduleDate.optional(),
    endDate: TripScheduleDate.optional(),
    status: z.boolean().optional(),
})

export type TripScheduleUpdateBody = z.infer<typeof TripScheduleUpdateBody>

export type TripScheduleBody = z.infer<typeof TripScheduleBody>
