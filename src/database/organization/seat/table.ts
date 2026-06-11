import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationSeatId, OrganizationSeatPublicId, OrganizationSeatType } from './type.js'
import { OrganizationVehicleId } from '../vehicle/type.js'

export interface OrganizationSeatTable extends Timestamps {
    id: GeneratedAlways<OrganizationSeatId>
    publicId: GeneratedAlways<OrganizationSeatPublicId>
    vehicleId: OrganizationVehicleId
    seatNumber: string
    type: OrganizationSeatType
}

export type OrganizationSeatTableInsert = Insertable<OrganizationSeatTable>
export type OrganizationSeatTableSelect = Selectable<OrganizationSeatTable>
export type OrganizationSeatTableUpdate = Updateable<OrganizationSeatTable>
