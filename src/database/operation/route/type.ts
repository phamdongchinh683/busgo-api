import { z } from 'zod'

export const OperationRouteId = z.coerce.number().brand<'operation.route.id'>()
export type OperationRouteId = z.infer<typeof OperationRouteId>
