import { z } from 'zod'

export const OperationRouteId = z.coerce.number().brand<'operation.route.id'>()
export type OperationRouteId = z.infer<typeof OperationRouteId>

export const OperationRoutePublicId = z.uuid().brand<'operation.route.public_id'>()
export type OperationRoutePublicId = z.infer<typeof OperationRoutePublicId>
