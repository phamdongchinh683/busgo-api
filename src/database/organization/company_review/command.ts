import { Transaction, sql } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { OrganizationCompanyReviewTableInsert } from './table.js'
import { db } from '../../../datasource/db.js'
import { OrganizationCompanyReviewId } from './type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

export async function insertReview(
    params: OrganizationCompanyReviewTableInsert,
    trx: Transaction<Database>
) {
    return trx
        .insertInto('organization.company_review')
        .values(params)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updateCompanyRatingCache(
    companyId: OrganizationBusCompanyId,
    trx: Transaction<Database>
) {
    const stats = await trx
        .selectFrom('organization.company_review')
        .select([
            sql<number>`count(*)::int`.as('totalReviews'),
            sql<number>`COALESCE(avg(rating), 0)::numeric(3,2)`.as('averageRating'),
        ])
        .where('companyId', '=', companyId)
        .where('status', '=', 'published')
        .executeTakeFirst()

    await trx
        .updateTable('organization.bus_company')
        .set({
            totalReviews: Number(stats?.totalReviews ?? 0),
            averageRating: Number(stats?.averageRating ?? 0),
        })
        .where('id', '=', companyId)
        .execute()
}

export async function replyToReview(
    reviewId: OrganizationCompanyReviewId,
    reply: string,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('organization.company_review')
        .set({ reply })
        .where('id', '=', reviewId)
        .returningAll()
        .executeTakeFirstOrThrow()
}
