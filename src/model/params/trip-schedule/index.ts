import { OperationTripSchedulePublicId } from '../../../database/operation/trip-schedule/type.js'
import { OperationTripPublicId } from '../../../database/operation/trip/type.js'
import z from 'zod'

export const TripScheduleIdParam = z.object({
    id: OperationTripSchedulePublicId,
})

export type TripScheduleIdParam = z.infer<typeof TripScheduleIdParam>

export const TripScheduleTripIdParam = z.object({
    id: OperationTripSchedulePublicId,
    tripId: OperationTripPublicId,
})

export type TripScheduleTripIdParam = z.infer<typeof TripScheduleTripIdParam>
