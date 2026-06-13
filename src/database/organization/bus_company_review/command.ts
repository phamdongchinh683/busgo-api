import _ from 'lodash'
import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyReviewTableInsert } from './table.js'

export async function upsertOne(params: OrganizationBusCompanyReviewTableInsert) {
    const data = _.omitBy(params, v => _.isNil(v)) as OrganizationBusCompanyReviewTableInsert

    return db.transaction().execute(async trx => {
        const review = await trx
            .insertInto('organization.bus_company_review')
            .values(data)
            .onConflict(oc =>
                oc.columns(['companyId', 'userId', 'ticketId']).doUpdateSet({
                    rating: params.rating,
                    comment: params.comment ?? null,
                })
            )
            .returningAll()
            .executeTakeFirstOrThrow()

        const agg = trx
            .selectFrom('organization.bus_company_review as r')
            .select([
                sql<number>`count(*)::int`.as('reviewCount'),
                sql<number>`count(*) FILTER (WHERE r.rating = 1)::int`.as('star1'),
                sql<number>`count(*) FILTER (WHERE r.rating = 2)::int`.as('star2'),
                sql<number>`count(*) FILTER (WHERE r.rating = 3)::int`.as('star3'),
                sql<number>`count(*) FILTER (WHERE r.rating = 4)::int`.as('star4'),
                sql<number>`count(*) FILTER (WHERE r.rating = 5)::int`.as('star5'),
            ])
            .where('r.companyId', '=', review.companyId)

        await trx
            .updateTable('organization.bus_company as bc')
            .from(agg.as('agg'))
            .set(
                sql`review_count = agg.review_count, star_1 = agg.star1, star_2 = agg.star2, star_3 = agg.star3, star_4 = agg.star4, star_5 = agg.star5` as any
            )
            .where('bc.id', '=', review.companyId)
            .executeTakeFirst()

        return review
    })
}
