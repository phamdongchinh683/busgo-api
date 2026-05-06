import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { BookingTicketId } from '../../booking/ticket/type.js'
import { OrganizationCompanyReviewId } from './type.js'

export async function getReviewsByCompanyId(
    companyId: OrganizationBusCompanyId,
    page: number = 1,
    limit: number = 10
) {
    const offset = (page - 1) * limit

    return db
        .selectFrom('organization.company_review as cr')
        .innerJoin('auth.user as u', 'u.id', 'cr.userId')
        .select([
            'cr.id',
            'cr.rating',
            'cr.comment',
            'cr.reply',
            'cr.createdAt',
            'u.fullName as userFullName',
        ])
        .where('cr.companyId', '=', companyId)
        .where('cr.status', '=', 'published')
        .orderBy('cr.createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute()
}

export async function findReviewByTicketId(ticketId: BookingTicketId) {
    return db
        .selectFrom('organization.company_review')
        .selectAll()
        .where('ticketId', '=', ticketId)
        .executeTakeFirst()
}

export async function findReviewById(reviewId: OrganizationCompanyReviewId) {
    return db
        .selectFrom('organization.company_review')
        .selectAll()
        .where('id', '=', reviewId)
        .executeTakeFirst()
}
