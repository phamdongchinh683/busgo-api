import { db } from '../../../datasource/db.js'
import { BusCompanyReviewFilter } from '../../../model/query/review/index.js'

export async function findAllByCompany(query: BusCompanyReviewFilter) {
    const { companyId, limit, next, star } = query

    return db
        .selectFrom('organization.bus_company_review as r')
        .innerJoin('auth.user as u', 'u.id', 'r.userId')
        .select(['r.id', 'r.rating', 'r.comment', 'u.fullName as reviewerName', 'r.createdAt'])
        .where(eb => {
            const cond = []
            cond.push(eb('r.companyId', '=', companyId))
            if (star) cond.push(eb('r.rating', '=', star))
            if (next) cond.push(eb('r.id', '<', next))
            return eb.and(cond)
        })
        .orderBy('r.id', 'desc')
        .limit(limit + 1)
        .execute()
}
