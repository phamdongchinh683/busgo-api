import z from 'zod'
import { OperationRouteId } from '../../../database/operation/route/type.js'

export const RouteFilter = z.object({
    limit: z.coerce.number().optional().default(10),
    next: OperationRouteId.optional(),
})

export type RouteFilter = z.infer<typeof RouteFilter>
