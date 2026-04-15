import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationCompanyDriverId } from './type.js'
import { AuthUserId, AuthUserStatus } from '../../auth/user/type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

export interface OrganizationCompanyDriverTable extends Timestamps {
    id: GeneratedAlways<OrganizationCompanyDriverId>
    userId: AuthUserId
    companyId: OrganizationBusCompanyId
    status: AuthUserStatus
}

export type OrganizationCompanyDriverTableInsert = Insertable<OrganizationCompanyDriverTable>
export type OrganizationCompanyDriverTableSelect = Selectable<OrganizationCompanyDriverTable>
export type OrganizationCompanyDriverTableUpdate = Updateable<OrganizationCompanyDriverTable>
