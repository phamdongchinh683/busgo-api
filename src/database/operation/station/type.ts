import { z } from 'zod'

export const OperationStationId = z.coerce.number().brand<'operation.station.id'>()
export type OperationStationId = z.infer<typeof OperationStationId>

export const OperationStationPublicId = z.uuid().brand<'operation.station.public_id'>()
export type OperationStationPublicId = z.infer<typeof OperationStationPublicId>
