import { OperationRoutePublicId } from '../../../database/operation/route/type.js'
import z from 'zod'

export const OperationRouteIdParam = z.object({
    id: OperationRoutePublicId,
})
export type OperationRouteIdParam = z.infer<typeof OperationRouteIdParam>
