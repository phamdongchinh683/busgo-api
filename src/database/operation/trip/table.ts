import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OperationTripId, OperationTripStatus } from './type.js'
import { OperationRouteId } from '../route/type.js'
import { OrganizationVehicleId } from '../../organization/vehicle/type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { OperationTripScheduleId } from '../trip-schedule/type.js'

export interface OperationTripTable extends Timestamps {
    id: GeneratedAlways<OperationTripId>
    routeId: OperationRouteId
    vehicleId: OrganizationVehicleId | null
    scheduleId: OperationTripScheduleId
    driverIds: AuthUserId[] | null
    departureDate: Date
    status: OperationTripStatus
}

export type OperationTripTableInsert = Insertable<OperationTripTable>
export type OperationTripTableSelect = Selectable<OperationTripTable>
export type OperationTripTableUpdate = Updateable<OperationTripTable>
