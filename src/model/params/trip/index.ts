import { OperationTripId } from '../../../database/operation/trip/type.js'
import z from 'zod'

export const TripIdParam = z.object({})
export type TripIdParam = z.infer<typeof TripIdParam>

export const TripSeatParam = z.object({
    stopOrderPickup: z.coerce.number().int(),
    stopOrderDropoff: z.coerce.number().int(),
})

export type TripSeatParam = z.infer<typeof TripSeatParam>
