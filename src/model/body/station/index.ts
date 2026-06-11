import z from 'zod'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import {
    OperationStationId,
    OperationStationPublicId,
} from '../../../database/operation/station/type.js'
import { PublicApiId } from '../../public-id.js'

export const StationBody = z.object({
    address: z.string(),
    city: z.string(),
})

export type StationBody = z.infer<typeof StationBody>

export const StationResponse = z.object({
    stations: z.array(
        StationBody.extend({
            id: PublicApiId(OperationStationPublicId, OperationStationId),
            companyId: OrganizationBusCompanyId,
        })
    ),
    next: OperationStationId.nullable(),
})

export type StationResponse = z.infer<typeof StationResponse>

export const StationUpsertResponse = z.object({
    station: StationBody.extend({
        id: PublicApiId(OperationStationPublicId, OperationStationId),
        companyId: OrganizationBusCompanyId,
    }),
})

export type StationUpsertResponse = z.infer<typeof StationUpsertResponse>
