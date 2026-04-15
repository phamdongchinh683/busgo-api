import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { AuthUserStatus } from '../user/type.js'
import { AuthStaffProfileId, AuthStaffProfileRole } from './type.js'
import { AuthUserId } from '../user/type.js'

export interface AuthStaffProfileTable extends Timestamps {
    id: GeneratedAlways<AuthStaffProfileId>
    userId: AuthUserId
    role: AuthStaffProfileRole
    companyId: OrganizationBusCompanyId
    staffCode: string
    position: string
    department: string
    identityNumber: string
    hireDate: Date
    status: AuthUserStatus
}

export type AuthStaffProfileTableInsert = Insertable<AuthStaffProfileTable>
export type AuthStaffProfileTableSelect = Selectable<AuthStaffProfileTable>
export type AuthStaffProfileTableUpdate = Updateable<AuthStaffProfileTable>
