import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationBusCompanyId } from './type.js'

export interface OrganizationBusCompanyTable extends Timestamps {
    id: GeneratedAlways<OrganizationBusCompanyId>
    name: string
    hotline: string
    logoUrl: string
    address: string
    latitude: number
    longitude: number
    star1: number
    star2: number
    star3: number
    star4: number
    star5: number
    reviewCount: number
}

export type OrganizationBusCompanyTableInsert = Insertable<OrganizationBusCompanyTable>
export type OrganizationBusCompanyTableSelect = Selectable<OrganizationBusCompanyTable>
export type OrganizationBusCompanyTableUpdate = Updateable<OrganizationBusCompanyTable>
