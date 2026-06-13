import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OperationStationId } from './type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'

export interface OperationStationTable extends Timestamps {
    id: GeneratedAlways<OperationStationId>
    address: string
    city: string
    companyId: OrganizationBusCompanyId | null
}

export type OperationStationTableInsert = Insertable<OperationStationTable>
export type OperationStationTableSelect = Selectable<OperationStationTable>
export type OperationStationTableUpdate = Updateable<OperationStationTable>
