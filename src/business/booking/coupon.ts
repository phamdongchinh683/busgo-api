import { dal } from '../../database/index.js'
import {
    CouponBody,
    CouponCheckCodeQuery,
    CouponFilter,
    CouponSupportFilter,
} from '../../model/query/coupon/index.js'
import { utils } from '../../utils/index.js'
import { HttpErr } from '../../app/index.js'
import { CouponResponse } from '../../model/body/coupon/index.js'
import { BookingCouponId, BookingDiscountType } from '../../database/booking/coupon/type.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { OperationRouteId } from '../../database/operation/route/type.js'
import { OperationTripScheduleId } from '../../database/operation/trip-schedule/type.js'
import { OperationStationId } from '../../database/operation/station/type.js'

export async function getCouponByCode(params: CouponCheckCodeQuery) {
    const coupon = await dal.booking.coupon.cmd.getCouponByCode(params)

    validateCoupon(coupon, params.orderTotal)

    const { discountAmount, finalTotal } = applyCoupon(coupon, params.orderTotal)

    return {
        id: coupon.id,
        discountAmount: discountAmount,
        finalTotal: finalTotal,
    }
}

export async function getCoupons(filter: CouponFilter) {
    const rows = await dal.booking.coupon.cmd.findAllCoupons(filter)
    const hasNextPage = rows.length > 10
    const data = hasNextPage ? rows.slice(0, 10) : rows
    return {
        coupons: data,
        next: hasNextPage ? data[data.length - 1]?.id : null,
    }
}

export function validateCoupon(coupon: CouponResponse, orderTotal: number) {
    const now = utils.time.getNow().toDate()
    if (coupon.startDate && coupon.startDate > now) {
        throw new HttpErr.UnprocessableEntity(
            'Mã giảm giá chưa có hiệu lực.',
            'COUPON_NOT_ACTIVE_YET'
        )
    }
    if (coupon.endDate && coupon.endDate < now) {
        throw new HttpErr.UnprocessableEntity('Mã giảm giá đã hết hạn.', 'COUPON_EXPIRED')
    }
    if (!coupon.isActive) {
        throw new HttpErr.UnprocessableEntity(
            'Mã giảm giá không còn hoạt động.',
            'COUPON_NOT_ACTIVE'
        )
    }
    if (coupon.usedQuantity >= coupon.totalQuantity) {
        throw new HttpErr.UnprocessableEntity(
            'Mã giảm giá đã hết lượt sử dụng.',
            'COUPON_OUT_OF_STOCK',
            {
                totalQuantity: coupon.totalQuantity,
            }
        )
    }
    if (coupon.minOrderAmount > orderTotal) {
        throw new HttpErr.UnprocessableEntity(
            'Tổng giá trị đơn hàng chưa đủ điều kiện áp dụng mã giảm giá này.',
            'ORDER_NOT_ELIGIBLE',
            { minOrderValue: coupon.minOrderAmount }
        )
    }
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount < coupon.discountValue) {
        throw new HttpErr.UnprocessableEntity(
            'Giá trị giảm giá vượt quá mức giảm tối đa của mã này.',
            'MAX_DISCOUNT_EXCEEDED',
            { maxDiscountAmount: coupon.maxDiscountAmount }
        )
    }

    return coupon
}

export function applyCoupon(coupon: CouponResponse, orderTotal: number) {
    let discountAmount = 0

    if (coupon.discountType === BookingDiscountType.enum.percent) {
        discountAmount = orderTotal * (coupon.discountValue / 100)

        if (coupon.maxDiscountAmount !== null) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount)
        }
    }

    if (coupon.discountType === BookingDiscountType.enum.fixed) {
        discountAmount = Math.min(coupon.discountValue, orderTotal)
    }

    discountAmount = Math.round(discountAmount * 100) / 100

    const finalTotal = Math.max(0, Math.round((orderTotal - discountAmount) * 100) / 100)

    return {
        discountAmount: discountAmount,
        finalTotal: finalTotal,
    }
}

export async function resultAmountOneWay(
    params: {
        companyId: OrganizationBusCompanyId
        scheduleId: OperationTripScheduleId
        routeId: OperationRouteId
        fromStationId: OperationStationId
        toStationId: OperationStationId
    },
    couponId?: BookingCouponId
) {
    const originalAmount = await dal.operation.tripPriceTemplate.cmd.getPriceByCompanyId({
        companyId: params.companyId,
        fromStationId: params.fromStationId,
        toStationId: params.toStationId,
    })

    if (!originalAmount) {
        throw new HttpErr.NotFound('Không tìm thấy giá chuyến đi cho chặng đã chọn.', {
            companyId: params.companyId,
            fromStationId: params.fromStationId,
            toStationId: params.toStationId,
        })
    }

    if (couponId) {
        const coupon = await dal.booking.coupon.cmd.getCouponByCode({
            id: couponId,
            orderTotal: originalAmount?.price,
        })
        if (coupon) {
            validateCoupon(coupon, originalAmount.price)
            await dal.booking.coupon.cmd.upCountUsedQuantity(couponId, '+')
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

export async function getCouponsSupport(filter: CouponSupportFilter) {
    const rows = await dal.booking.coupon.query.findAllSupportCoupons(filter)
    const { data, next } = utils.common.paginateByCursor(rows, filter.limit)
    return { coupons: data, next: next }
}

export async function createCoupon(body: CouponBody) {
    return {
        coupon: await dal.booking.coupon.cmd.createOne(body),
    }
}

export async function updateCoupon(id: BookingCouponId, body: CouponBody) {
    return {
        coupon: await dal.booking.coupon.cmd.updateOne(id, body),
    }
}
