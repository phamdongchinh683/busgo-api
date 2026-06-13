import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OperationTripStopTemplateId } from './type.js'
import { OperationStationId } from '../station/type.js'
import { OperationTripScheduleId } from '../trip-schedule/type.js'
import { OperationRouteId } from '../route/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'

export interface OperationTripStopTemplateTable extends Timestamps {
    id: GeneratedAlways<OperationTripStopTemplateId>
    scheduleId: OperationTripScheduleId
    stationId: OperationStationId
    companyId: OrganizationBusCompanyId
    routeId: OperationRouteId
    stopOrder: number
    allowPickup: boolean
    allowDropoff: boolean
}

export type OperationTripStopTemplateTableInsert = Insertable<OperationTripStopTemplateTable>
export type OperationTripStopTemplateTableSelect = Selectable<OperationTripStopTemplateTable>
export type OperationTripStopTemplateTableUpdate = Updateable<OperationTripStopTemplateTable>
