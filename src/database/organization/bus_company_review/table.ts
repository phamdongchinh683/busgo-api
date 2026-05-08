import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationBusCompanyReviewId } from './type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { AuthUserId } from '../../auth/user/type.js'

export interface OrganizationBusCompanyReviewTable extends Timestamps {
    id: GeneratedAlways<OrganizationBusCompanyReviewId>
    companyId: OrganizationBusCompanyId
    userId: AuthUserId
    rating: number
    comment: string | null
}

export type OrganizationBusCompanyReviewTableInsert = Insertable<OrganizationBusCompanyReviewTable>
export type OrganizationBusCompanyReviewTableSelect = Selectable<OrganizationBusCompanyReviewTable>
export type OrganizationBusCompanyReviewTableUpdate = Updateable<OrganizationBusCompanyReviewTable>
