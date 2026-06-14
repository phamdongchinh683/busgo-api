import z from 'zod'
import { OperationStationId } from '../../../database/operation/station/type.js'

export const StationBody = z.object({
    address: z.string(),
    city: z.string(),
})

export type StationBody = z.infer<typeof StationBody>

export const StationResponse = z.object({
    stations: z.array(
        StationBody.extend({
            id: OperationStationId,
        })
    ),
    next: OperationStationId.nullable(),
})

export type StationResponse = z.infer<typeof StationResponse>

export const StationUpsertResponse = z.object({
    station: StationBody.extend({
        id: OperationStationId,
    }),
})

export type StationUpsertResponse = z.infer<typeof StationUpsertResponse>
