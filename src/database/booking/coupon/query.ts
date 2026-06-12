import { Expression, SqlBool } from 'kysely'
import { db } from '../../../datasource/db.js'
import {
    CouponCheckCodeQuery,
    CouponFilter,
    CouponSupportFilter,
} from '../../../model/query/coupon/index.js'
import { utils } from '../../../utils/index.js'

export async function findAll(q: CouponFilter) {
    const { next, orderTotal, companyId } = q
    const now = utils.time.getNow().toDate()

    let query = db
        .selectFrom('booking.coupon as c')
        .selectAll()
        .select(['c.id as cursorId', 'c.publicId as id'])
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
            if (companyId) {
                filters.push(eb('c.companyId', '=', companyId))
            }
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
        .select(['c.id as cursorId', 'c.publicId as id'])
        .where(eb => {
            const cond = []
            if (params.id) {
                cond.push(eb('c.id', '=', params.id))
            }
            if (params.companyId) {
                cond.push(eb('c.companyId', '=', params.companyId))
            }
            if (params.code) {
                cond.push(eb('c.code', '=', params.code))
            }
            return eb.and(cond)
        })
        .executeTakeFirstOrThrow()
}

export async function findAllSupportCoupons(filter: CouponSupportFilter) {
    const { next, date, type, status } = filter
    const now = utils.time.getNow().toDate()

    let query = db
        .selectFrom('booking.coupon as c')
        .selectAll()
        .select(['c.id as cursorId', 'c.publicId as id'])
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
                const isActive = status === 1
                filters.push(eb('c.isActive', '=', isActive))
            }
            if (filter.companyId) {
                filters.push(eb('c.companyId', '=', filter.companyId))
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
