import { Transaction, sql } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { OrganizationCompanyReviewTableInsert, OrganizationCompanyReviewTableSelect } from './table.js'
import { db } from '../../../datasource/db.js'
import { OrganizationCompanyReviewId } from './type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

export async function insertReview(
    params: OrganizationCompanyReviewTableInsert,
    trx: Transaction<Database>
) {
    const status = params.status ?? 'published'
    const reply = params.reply ?? null

    const result = await sql<OrganizationCompanyReviewTableSelect>`
        INSERT INTO organization.company_review (
            company_id, user_id, ticket_id, rating, comment, reply, status
        ) VALUES (
            ${params.companyId}, ${params.userId}, ${params.ticketId}, ${params.rating}, ${params.comment}, ${reply}, ${status}
        ) RETURNING *
    `.execute(trx)

    if (!result.rows[0]) throw new Error('Failed to insert review')
    return result.rows[0]
}

export async function updateCompanyRatingCache(
    companyId: OrganizationBusCompanyId,
    trx: Transaction<Database>
) {
    const statsResult = await sql<{ totalReviews: number; averageRating: number }>`
        SELECT 
            count(*)::int as "total_reviews",
            COALESCE(avg(rating), 0)::numeric(3,2) as "average_rating"
        FROM organization.company_review
        WHERE company_id = ${companyId} AND status = 'published'
    `.execute(trx)

    const stats = statsResult.rows[0]
    const totalReviews = stats?.totalReviews ?? 0
    const averageRating = stats?.averageRating ?? 0

    await sql`
        UPDATE organization.bus_company
        SET total_reviews = ${totalReviews}, average_rating = ${averageRating}
        WHERE id = ${companyId}
    `.execute(trx)
}

export async function replyToReview(
    reviewId: OrganizationCompanyReviewId,
    reply: string,
    trx?: Transaction<Database>
) {
    const result = await sql<OrganizationCompanyReviewTableSelect>`
        UPDATE organization.company_review
        SET reply = ${reply}, updated_at = NOW()
        WHERE id = ${reviewId}
        RETURNING *
    `.execute(trx ?? db)

    if (!result.rows[0]) throw new Error('Review not found')
    return result.rows[0]
}
