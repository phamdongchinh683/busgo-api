import { z } from 'zod'

export const OperationTripId = z.coerce.number().brand<'operation.trip.id'>()
export type OperationTripId = z.infer<typeof OperationTripId>

export const OperationTripStatus = z.enum(['scheduled', 'running', 'completed', 'cancelled'])
export type OperationTripStatus = z.infer<typeof OperationTripStatus>
