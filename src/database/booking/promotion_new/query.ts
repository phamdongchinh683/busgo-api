import { db } from '../../../datasource/db.js'
import { PromotionNewsListQuery } from '../../../model/query/promotion-new/index.js'
import { utils } from '../../../utils/index.js'

export async function findAll(query: PromotionNewsListQuery) {
    const { limit, next, status, date } = query
    let qb = db
        .selectFrom('booking.promotion_new as pn')
        .selectAll()
        .where(eb => {
            const cond = []
            if (date) {
                cond.push(eb('pn.startDate', '<=', date))
                cond.push(eb('pn.endDate', '>=', date))
            }
            if (next) {
                cond.push(eb('pn.id', '<', next))
            }
            if (status) {
                cond.push(eb('pn.isActive', '=', status))
            }
            return eb.and(cond)
        })
        .orderBy('pn.id', 'desc')

    return qb.limit(limit + 1).execute()
}
