import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OperationTripScheduleId, VehicleServiceType } from './type.js'
import { OperationRouteId } from '../route/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'

export interface OperationTripScheduleTable extends Timestamps {
    id: GeneratedAlways<OperationTripScheduleId>
    companyId: OrganizationBusCompanyId
    routeId: OperationRouteId
    departureTime: string
    startDate: Date
    endDate: Date
    status: 0 | 1
    vehicleType: VehicleServiceType | null
}

export type OperationTripScheduleTableInsert = Insertable<OperationTripScheduleTable>
export type OperationTripScheduleTableSelect = Selectable<OperationTripScheduleTable>
export type OperationTripScheduleTableUpdate = Updateable<OperationTripScheduleTable>
