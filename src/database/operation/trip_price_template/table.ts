import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OperationTripPriceTemplateId } from './type.js'
import { OperationStationId } from '../station/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { OperationRouteId } from '../route/type.js'

export interface OperationTripPriceTemplateTable extends Timestamps {
    id: GeneratedAlways<OperationTripPriceTemplateId>
    companyId: OrganizationBusCompanyId
    routeId: OperationRouteId
    fromStationId: OperationStationId
    toStationId: OperationStationId
    price: number
    status: 0 | 1
}

export type OperationTripPriceTemplateTableInsert = Insertable<OperationTripPriceTemplateTable>
export type OperationTripPriceTemplateTableSelect = Selectable<OperationTripPriceTemplateTable>
export type OperationTripPriceTemplateTableUpdate = Updateable<OperationTripPriceTemplateTable>
