import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationBusCompanyId, OrganizationBusCompanyPublicId } from './type.js'

export interface OrganizationBusCompanyTable extends Timestamps {
    id: GeneratedAlways<OrganizationBusCompanyId>
    publicId: GeneratedAlways<OrganizationBusCompanyPublicId>
    name: string
    hotline: string
    logoUrl: string
    address: string
    latitude: number
    longitude: number
    reviewCount: number
    reviewAvgStars: number
}

export type OrganizationBusCompanyTableInsert = Insertable<OrganizationBusCompanyTable>
export type OrganizationBusCompanyTableSelect = Selectable<OrganizationBusCompanyTable>
export type OrganizationBusCompanyTableUpdate = Updateable<OrganizationBusCompanyTable>
