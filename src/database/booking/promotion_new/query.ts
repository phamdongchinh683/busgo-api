import { db } from '../../../datasource/db.js'
import { PromotionNewsListQuery } from '../../../model/query/promotion-new/index.js'

export async function findAll(query: PromotionNewsListQuery) {
    const { limit, next, status } = query

    let qb = db
        .selectFrom('booking.promotion_new as pn')
        .select([
            'pn.id as cursorId',
            'pn.publicId as id',
            'pn.title',
            'pn.content',
            'pn.imageUrl',
            'pn.isActive',
            'pn.startDate',
            'pn.endDate',
        ])

    if (status !== undefined) {
        qb = qb.where('pn.isActive', '=', status === 1)
    }

    if (next) {
        qb = qb.where('pn.id', '<', next)
    }

    return qb
        .orderBy('pn.id', 'desc')
        .limit(limit + 1)
        .execute()
}
