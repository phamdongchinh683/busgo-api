import { z } from 'zod'

export const OperationStationId = z.coerce.number().brand<'operation.station.id'>()
export type OperationStationId = z.infer<typeof OperationStationId>
