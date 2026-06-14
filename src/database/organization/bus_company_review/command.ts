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

        const starColumn = `star_${params.rating}`
        await trx
            .updateTable('organization.bus_company as bc')
            .set({
                [starColumn]: sql`${starColumn} + 1`,
            })
            .where('bc.id', '=', review.companyId)
            .executeTakeFirst()

        return review
    })
}
