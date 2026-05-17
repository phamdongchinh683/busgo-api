import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationDriverMonthlyStatId } from './type.js'
import { AuthUserId } from '../../auth/user/type.js'

export interface OrganizationDriverMonthlyStatTable extends Timestamps {
    id: GeneratedAlways<OrganizationDriverMonthlyStatId>
    driverId: AuthUserId
    year: number
    month: number
    completedTripCount: number
    cancelledTripCount: number
}

export type OrganizationDriverMonthlyStatInsert = Insertable<OrganizationDriverMonthlyStatTable>
export type OrganizationDriverMonthlyStatSelect = Selectable<OrganizationDriverMonthlyStatTable>
export type OrganizationDriverMonthlyStatUpdate = Updateable<OrganizationDriverMonthlyStatTable>
