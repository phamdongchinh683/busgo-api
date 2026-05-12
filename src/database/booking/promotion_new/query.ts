import { db } from '../../../datasource/db.js'
import { PromotionNewsListQuery } from '../../../model/query/promotion-new/index.js'

export async function findAll(query: PromotionNewsListQuery) {
    const { limit, next, status } = query
    const qb = db
        .selectFrom('booking.promotion_new as pn')
        .selectAll()
        .where(eb => {
            const cond = []
            if (next) {
                cond.push(eb('pn.id', '<', next))
            }
            if (status !== undefined) {
                cond.push(eb('pn.isActive', '=', status === 'true'))
            }
            return eb.and(cond)
        })
        .orderBy('pn.id', 'desc')

    return qb.limit(limit + 1).execute()
}
