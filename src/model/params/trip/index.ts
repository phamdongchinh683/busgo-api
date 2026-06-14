import z from 'zod'
import { OperationTripId } from '../../../database/operation/trip/type.js'

export const TripIdParam = z.object({
    id: OperationTripId,
})
export type TripIdParam = z.infer<typeof TripIdParam>

export const TripSeatParam = z.object({
    stopOrderPickup: z.coerce.number().int(),
    stopOrderDropoff: z.coerce.number().int(),
})

export type TripSeatParam = z.infer<typeof TripSeatParam>
