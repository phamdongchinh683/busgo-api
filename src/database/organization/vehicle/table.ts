import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import {
    OrganizationVehicleId,
    OrganizationVehicleType,
    OrganizationVehicleStatus,
} from './type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

export interface OrganizationVehicleTable extends Timestamps {
    id: GeneratedAlways<OrganizationVehicleId>
    plateNumber: string
    type: OrganizationVehicleType
    companyId: OrganizationBusCompanyId
    totalSeats: number
    status: OrganizationVehicleStatus
}

export type OrganizationVehicleTableInsert = Insertable<OrganizationVehicleTable>
export type OrganizationVehicleTableSelect = Selectable<OrganizationVehicleTable>
export type OrganizationVehicleTableUpdate = Updateable<OrganizationVehicleTable>
