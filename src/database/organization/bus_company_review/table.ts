import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { OrganizationBusCompanyReviewId, OrganizationBusCompanyReviewPublicId } from './type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { BookingTicketId } from '../../booking/ticket/type.js'

export interface OrganizationBusCompanyReviewTable extends Timestamps {
    id: GeneratedAlways<OrganizationBusCompanyReviewId>
    publicId: GeneratedAlways<OrganizationBusCompanyReviewPublicId>
    companyId: OrganizationBusCompanyId
    userId: AuthUserId
    ticketId: BookingTicketId
    rating: number
    comment: string | null
}

export type OrganizationBusCompanyReviewTableInsert = Insertable<OrganizationBusCompanyReviewTable>
export type OrganizationBusCompanyReviewTableSelect = Selectable<OrganizationBusCompanyReviewTable>
export type OrganizationBusCompanyReviewTableUpdate = Updateable<OrganizationBusCompanyReviewTable>
