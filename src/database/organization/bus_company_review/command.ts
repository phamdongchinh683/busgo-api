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

        const agg = trx
            .selectFrom('organization.bus_company_review as r')
            .select([
                sql<number>`count(*)::int`.as('reviewCount'),
                sql<number>`coalesce(round(avg(r.rating)::numeric, 1), 0)`.as('reviewAvgStars'),
            ])
            .where('r.companyId', '=', review.companyId)

        await trx
            .updateTable('organization.bus_company as bc')
            .from(agg.as('agg'))
            .set({
                reviewCount: sql`agg."reviewCount"`,
                reviewAvgStars: sql`agg."reviewAvgStars"`,
            })
            .where('bc.id', '=', review.companyId)
            .executeTakeFirst()

        return review
    })
}