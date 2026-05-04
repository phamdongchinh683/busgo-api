import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import { BookingTicketId } from '../../booking/ticket/type.js'
import { OrganizationCompanyReviewTableSelect } from './table.js'

export async function getReviewsByCompanyId(
    companyId: OrganizationBusCompanyId,
    page: number = 1,
    limit: number = 10
) {
    const offset = (page - 1) * limit

    const result = await sql<{
        id: number
        rating: number
        comment: string | null
        reply: string | null
        createdAt: string | Date
        userFullName: string
    }>`
        SELECT 
            cr.id, 
            cr.rating, 
            cr.comment, 
            cr.reply, 
            cr.created_at, 
            u.full_name as "user_full_name"
        FROM organization.company_review cr
        INNER JOIN auth.user u ON u.id = cr.user_id
        WHERE cr.company_id = ${companyId} AND cr.status = 'published'
        ORDER BY cr.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
    `.execute(db)

    return result.rows
}

export async function findReviewByTicketId(ticketId: BookingTicketId) {
    const result = await sql<OrganizationCompanyReviewTableSelect>`
        SELECT * FROM organization.company_review
        WHERE ticket_id = ${ticketId}
    `.execute(db)

    return result.rows[0]
}
