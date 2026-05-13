import { Expression, SqlBool } from 'kysely'
import { db } from '../../../datasource/db.js'
import {
    CouponCheckCodeQuery,
    CouponFilter,
    CouponSupportFilter,
} from '../../../model/query/coupon/index.js'
import { utils } from '../../../utils/index.js'

export function findAll(q: CouponFilter) {
    const { next, orderTotal } = q
    const now = utils.time.getNow().toDate()

    let query = db
        .selectFrom('booking.coupon as c')
        .selectAll()
        .where(eb => {
            const filters: Expression<SqlBool>[] = []

            filters.push(eb('c.startDate', '<=', now).or(eb('c.startDate', 'is', null)))
            filters.push(eb('c.endDate', '>=', now).or(eb('c.endDate', 'is', null)))
            filters.push(eb('c.isActive', '=', true))
            filters.push(
                eb.or([
                    eb('c.usedQuantity', '=', 0),
                    eb('c.usedQuantity', '<', eb.ref('c.totalQuantity')),
                ])
            )
            filters.push(eb('c.minOrderAmount', '<=', orderTotal))
            return eb.and(filters)
        })

    if (next) {
        query = query.where('c.id', '<', next)
    }

    return query
        .orderBy('c.id', 'desc')
        .limit(10 + 1)
        .execute()
}

export async function findOneByCode(params: CouponCheckCodeQuery) {
    return db
        .selectFrom('booking.coupon as c')
        .selectAll()
        .where(eb => {
            const cond = []
            if (params.id) {
                cond.push(eb('c.id', '=', params.id))
            }
            if (params.code) {
                cond.push(eb('c.code', '=', params.code))
            }
            return eb.and(cond)
        })
        .executeTakeFirstOrThrow()
}

export function findAllSupportCoupons(filter: CouponSupportFilter) {
    const { next, date, type, status } = filter
    const now = utils.time.getNow().toDate()

    let query = db
        .selectFrom('booking.coupon as c')
        .selectAll()
        .where(eb => {
            const filters: Expression<SqlBool>[] = []

            filters.push(eb('c.startDate', '<=', now).or(eb('c.startDate', 'is', null)))
            filters.push(eb('c.endDate', '>=', now).or(eb('c.endDate', 'is', null)))
            filters.push(eb('c.usedQuantity', '<', eb.ref('c.totalQuantity')))
            if (date) {
                filters.push(eb('c.createdAt', '<=', date))
            }
            if (type) {
                filters.push(eb('c.discountType', '=', type))
            }
            if (status !== undefined) {
                const isActive = status === 'true'
                filters.push(eb('c.isActive', '=', isActive))
            }
            return eb.and(filters)
        })

    if (next) {
        query = query.where('c.id', '<', next)
    }

    return query
        .orderBy('c.id', 'desc')
        .limit(filter.limit + 1)
        .execute()
}
