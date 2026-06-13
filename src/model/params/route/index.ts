import { OperationRouteId } from '../../../database/operation/route/type.js'
import z from 'zod'

export const OperationRouteIdParam = z.object({
    id: OperationRouteId,
})
export type OperationRouteIdParam = z.infer<typeof OperationRouteIdParam>
