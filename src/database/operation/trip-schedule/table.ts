import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OperationTripScheduleId, OperationTripSchedulePublicId } from './type.js'
import { OperationRouteId } from '../route/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'

export interface OperationTripScheduleTable extends Timestamps {
    id: GeneratedAlways<OperationTripScheduleId>
    publicId: GeneratedAlways<OperationTripSchedulePublicId>
    companyId: OrganizationBusCompanyId
    routeId: OperationRouteId
    departureTime: string
    startDate: Date
    endDate: Date
    status: boolean
}

export type OperationTripScheduleTableInsert = Insertable<OperationTripScheduleTable>
export type OperationTripScheduleTableSelect = Selectable<OperationTripScheduleTable>
export type OperationTripScheduleTableUpdate = Updateable<OperationTripScheduleTable>
