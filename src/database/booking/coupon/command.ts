import { applyCoupon, validateCoupon } from '../../../business/booking/coupon.js'
import {
    CouponBody,
    CouponCheckCodeQuery,
    CouponFilter,
} from '../../../model/query/coupon/index.js'
import { dal } from '../../index.js'
import { BookingCouponId } from './type.js'
import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { OperationStationId } from '../../operation/station/type.js'
import { HttpErr } from '../../../app/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { db } from '../../../datasource/db.js'
import { BookingCouponTableInsert, BookingCouponTableUpdate } from './table.js'
import _ from 'lodash'
import { clearCouponCache } from '../../../business/booking/coupon-cache.js'

export async function findAllCoupons(filter: CouponFilter) {
    return dal.booking.coupon.query.findAll(filter)
}

export async function getCouponByCode(params: CouponCheckCodeQuery) {
    return dal.booking.coupon.query.findOneByCode(params)
}

export async function getCouponByCodeTransaction(
    params: CouponCheckCodeQuery,
    trx: Transaction<Database>
) {
    return trx
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
        .forUpdate('c')
        .executeTakeFirstOrThrow()
}

export async function resultAmountOneWay(
    params: {
        companyId: OrganizationBusCompanyId
        fromStationId: OperationStationId
        toStationId: OperationStationId
    },
    trx: Transaction<Database>,
    couponId?: BookingCouponId
) {
    const originalAmount = await dal.operation.tripPriceTemplate.cmd.getPriceByCompanyId(
        params,
        trx
    )

    if (!originalAmount) {
        throw new HttpErr.NotFound(
            'Không tìm thấy giá chuyến đi cho chặng đã chọn.',
            {
                fromStationId: params.fromStationId,
                toStationId: params.toStationId,
            },
            'TRIP_PRICE_NOT_FOUND'
        )
    }

    if (couponId) {
        const coupon = await getCouponByCodeTransaction(
            {
                id: couponId,
                orderTotal: originalAmount.price,
            },
            trx
        )

        if (coupon) {
            validateCoupon(coupon, originalAmount.price)
            const { discountAmount, finalTotal } = applyCoupon(coupon, originalAmount.price)
            return {
                originalAmount: originalAmount.price,
                discountAmount,
                totalAmount: finalTotal,
            }
        }
    }

    return {
        originalAmount: originalAmount.price,
        discountAmount: 0,
        totalAmount: originalAmount.price,
    }
}

export async function resultAmountRoundTrip(
    total: number,
    trx: Transaction<Database>,
    couponId?: BookingCouponId
) {
    if (couponId) {
        const coupon = await getCouponByCodeTransaction(
            {
                id: couponId,
                orderTotal: total,
            },
            trx
        )

        if (coupon) {
            validateCoupon(coupon, total)
            const { discountAmount, finalTotal } = applyCoupon(coupon, total)
            return {
                originalAmount: total,
                discountAmount,
                totalAmount: finalTotal,
            }
        }
    }

    return {
        originalAmount: total,
        discountAmount: 0,
        totalAmount: total,
    }
}

export async function createOne(body: CouponBody & { companyId: OrganizationBusCompanyId }) {
    const data = _.omitBy(body, v => _.isNil(v)) as BookingCouponTableInsert
    return db
        .insertInto('booking.coupon')
        .values(data)
        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}

export async function updateOne(
    id: BookingCouponId,
    body: CouponBody & { companyId: OrganizationBusCompanyId }
) {
    const data = _.omitBy(body, v => _.isNil(v)) as BookingCouponTableUpdate
    return db
        .updateTable('booking.coupon as c')
        .set(data)
        .where(eb => {
            const cond = []
            cond.push(eb('c.id', '=', id))
            cond.push(eb('c.companyId', '=', body.companyId))
            return eb.and(cond)
        })

        .returningAll()
        .returning('publicId as id')
        .executeTakeFirstOrThrow()
}

export async function upCountUsedQuantity(
    id: BookingCouponId,
    type: '+' | '-',
    trx?: Transaction<Database>
) {
    const usedQuantity =
        type === '+'
            ? sql<number>`coalesce(used_quantity, 0) + 1`
            : sql<number>`greatest(coalesce(used_quantity, 0) - 1, 0)`
    let query = (trx ?? db)
        .updateTable('booking.coupon')
        .set({
            usedQuantity,
        })
        .where('id', '=', id)

    if (type === '+') {
        query = query.where(sql<boolean>`coalesce(used_quantity, 0) < total_quantity`)
    }

    const coupon = await query.returningAll().executeTakeFirst()

    if (!coupon) {
        throw new HttpErr.UnprocessableEntity(
            'Mã giảm giá đã hết lượt sử dụng.',
            'COUPON_OUT_OF_STOCK'
        )
    }

    await clearCouponCache(coupon.companyId)

    return coupon
}

export async function downCountUsedQuantityMany(
    couponIds: BookingCouponId[],
    trx: Transaction<Database>
) {
    const counts = new Map<BookingCouponId, number>()

    for (const couponId of couponIds) {
        counts.set(couponId, (counts.get(couponId) ?? 0) + 1)
    }

    const companyIds = new Set<OrganizationBusCompanyId>()

    for (const [couponId, count] of counts) {
        const coupon = await trx
            .updateTable('booking.coupon')
            .set({
                usedQuantity: sql<number>`greatest(coalesce(used_quantity, 0) - ${count}, 0)`,
            })
            .where('id', '=', couponId)
            .returning('companyId')
            .executeTakeFirst()

        if (coupon) {
            companyIds.add(coupon.companyId)
        }
    }

    await Promise.all([...companyIds].map(companyId => clearCouponCache(companyId)))
}
