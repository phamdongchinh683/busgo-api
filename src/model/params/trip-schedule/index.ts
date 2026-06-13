import z from 'zod'
import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'

export const TripScheduleIdParam = z.object({
    id: OperationTripScheduleId,
})

export type TripScheduleIdParam = z.infer<typeof TripScheduleIdParam>

export const TripScheduleTripIdParam = z.object({})

export type TripScheduleTripIdParam = z.infer<typeof TripScheduleTripIdParam>
