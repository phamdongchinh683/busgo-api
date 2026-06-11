import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { AuthUserId } from '../../auth/user/type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { OrganizationCompanyMemberId, OrganizationCompanyMemberPublicId } from './type.js'

export interface OrganizationCompanyMemberTable extends Timestamps {
    id: GeneratedAlways<OrganizationCompanyMemberId>
    publicId: GeneratedAlways<OrganizationCompanyMemberPublicId>
    userId: AuthUserId
    companyId: OrganizationBusCompanyId
    staffCode: string | null
    position: string | null
    department: string | null
    identityNumber: string | null
    hireDate: Date | null
}

export type OrganizationCompanyMemberTableInsert = Insertable<OrganizationCompanyMemberTable>
export type OrganizationCompanyMemberTableSelect = Selectable<OrganizationCompanyMemberTable>
export type OrganizationCompanyMemberTableUpdate = Updateable<OrganizationCompanyMemberTable>
