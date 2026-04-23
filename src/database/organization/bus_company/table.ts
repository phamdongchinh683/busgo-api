import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationBusCompanyId } from './type.js'

export interface OrganizationBusCompanyTable extends Timestamps {
    id: GeneratedAlways<OrganizationBusCompanyId>
    name: string
    hotline: string
    logoUrl: string
    address: string
}

export type OrganizationBusCompanyTableInsert = Insertable<OrganizationBusCompanyTable>
export type OrganizationBusCompanyTableSelect = Selectable<OrganizationBusCompanyTable>
export type OrganizationBusCompanyTableUpdate = Updateable<OrganizationBusCompanyTable>
