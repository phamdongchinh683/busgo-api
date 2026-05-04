import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { BookingTicketId } from '../../booking/ticket/type.js'

export async function getReviewsByCompanyId(
    companyId: OrganizationBusCompanyId,
    page: number = 1,
    limit: number = 10
) {
    const offset = (page - 1) * limit

    return db
        .selectFrom('organization.company_review as cr')
        .innerJoin('auth.user as u', 'u.id', 'cr.userId')
        .where('cr.companyId', '=', companyId)
        .where('cr.status', '=', 'published')
        .select([
            'cr.id',
            'cr.rating',
            'cr.comment',
            'cr.reply',
            'cr.createdAt',
            'u.fullName as userFullName',
        ])
        .orderBy('cr.createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute()
}

export async function findReviewByTicketId(ticketId: BookingTicketId) {
    return db
        .selectFrom('organization.company_review')
        .where('ticketId', '=', ticketId)
        .selectAll()
        .executeTakeFirst()
}
