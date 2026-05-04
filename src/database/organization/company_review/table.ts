import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationCompanyReviewId, OrganizationCompanyReviewStatus } from './type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { BookingTicketId } from '../../booking/ticket/type.js'

export interface OrganizationCompanyReviewTable extends Timestamps {
    id: GeneratedAlways<OrganizationCompanyReviewId>
    companyId: OrganizationBusCompanyId
    userId: AuthUserId
    ticketId: BookingTicketId
    rating: number
    comment: string | null
    reply: string | null
    status: OrganizationCompanyReviewStatus
}

export type OrganizationCompanyReviewTableInsert = Insertable<OrganizationCompanyReviewTable>
export type OrganizationCompanyReviewTableSelect = Selectable<OrganizationCompanyReviewTable>
export type OrganizationCompanyReviewTableUpdate = Updateable<OrganizationCompanyReviewTable>
