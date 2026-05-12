import z from 'zod'
import { OrderBy } from '../../common.js'
import { OperationTripId } from '../../../database/operation/trip/type.js'
import { OperationStationId } from '../../../database/operation/station/type.js'
import { OperationTripStatus } from '../../../database/operation/trip/type.js'

export const TripFilter = z.object({
    limit: z.coerce.number().optional().default(10),
    next: OperationTripId.optional(),
    from: z.string().optional(),
    status: OperationTripStatus.optional(),
    to: z.string().optional(),
    date: z.coerce.date().optional(),
    orderBy: OrderBy,
})

export type TripFilter = z.infer<typeof TripFilter>

export const TripPickupQuery = z.object({
    fromStationId: OperationStationId,
    stopOrder: z.coerce.number().int(),
})

export type TripPickupQuery = z.infer<typeof TripPickupQuery>

export const TripQuery = z.object({
    id: OperationTripId,
})

export type TripQuery = z.infer<typeof TripQuery>

export const DriverTripQuery = z.object({
    limit: z.coerce.number().optional().default(10),
    date: z.coerce.date().optional(),
    status: OperationTripStatus.optional(),
    next: OperationTripId.nullable().optional(),
    orderBy: OrderBy,
})

export type DriverTripQuery = z.infer<typeof DriverTripQuery>
