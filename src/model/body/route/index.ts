import { z } from 'zod'
import { OperationRouteId } from '../../../database/operation/route/type.js'

export const OperationRouteStopResponse = z.object({
    address: z.string(),
    city: z.string(),
    stopOrder: z.number(),
})
export type OperationRouteStopResponse = z.infer<typeof OperationRouteStopResponse>

export const OperationRouteResponse = z.object({
    stops: z.array(OperationRouteStopResponse),
})
export type OperationRouteResponse = z.infer<typeof OperationRouteResponse>

export const OperationRouteBody = z.object({
    fromLocation: z.string(),
    toLocation: z.string(),
    distanceKm: z.number(),
    durationMinutes: z.number(),
})
export type OperationRouteBody = z.infer<typeof OperationRouteBody>

export const OperationRouteInsertResponse = z.object({
    route: OperationRouteBody.extend({
        id: OperationRouteId,
    }),
})
export type OperationRouteInsertResponse = z.infer<typeof OperationRouteInsertResponse>

export const OperationRoutesResponse = z.object({
    routes: z.array(
        OperationRouteBody.extend({
            id: OperationRouteId,
        })
    ),
    next: OperationRouteId.nullable(),
})
export type OperationRoutesResponse = z.infer<typeof OperationRoutesResponse>
