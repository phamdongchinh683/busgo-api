import _ from 'lodash'
import { Kysely, sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { OrganizationBusCompanyReviewTableInsert } from './table.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'

export async function insertOne(params: OrganizationBusCompanyReviewTableInsert) {
    const data = _.omitBy(params, v => _.isNil(v)) as OrganizationBusCompanyReviewTableInsert

    return db.transaction().execute(async trx => {
        const review = await trx
            .insertInto('organization.bus_company_review')
            .values(data)
            .onConflict(oc =>
                oc.columns(['companyId', 'userId']).doUpdateSet({
                    rating: data.rating,
                    comment: data.comment ?? null,
                })
            )
            .returningAll()
            .executeTakeFirstOrThrow()

        await recomputeCompanyReviewStats(trx, review.companyId)

        return review
    })
}

async function recomputeCompanyReviewStats(trx: Kysely<any>, companyId: OrganizationBusCompanyId) {
    const agg = await trx
        .selectFrom('organization.bus_company_review as r')
        .select([
            sql<number>`count(*)::int`.as('reviewCount'),
            sql<number>`coalesce(round(avg(r.rating)::numeric, 1), 0)::numeric`.as('reviewAvgStars'),
        ])
        .where('r.companyId', '=', companyId)
        .executeTakeFirstOrThrow()

    await trx
        .updateTable('organization.bus_company as bc')
        .set({
            reviewCount: agg.reviewCount,
            reviewAvgStars: agg.reviewAvgStars,
        })
        .where('bc.id', '=', companyId)
        .executeTakeFirst()
}
