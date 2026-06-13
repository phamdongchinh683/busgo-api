import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OperationRouteId } from './type.js'

export interface OperationRouteTable extends Timestamps {
    id: GeneratedAlways<OperationRouteId>
    fromLocation: string
    toLocation: string
    distanceKm: number
    durationMinutes: number
}

export type OperationRouteTableInsert = Insertable<OperationRouteTable>
export type OperationRouteTableSelect = Selectable<OperationRouteTable>
export type OperationRouteTableUpdate = Updateable<OperationRouteTable>
