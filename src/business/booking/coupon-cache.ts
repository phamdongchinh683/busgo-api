import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { CouponResponse, CouponsResponse } from '../../model/body/coupon/index.js'
import { CouponCheckCodeQuery } from '../../model/query/coupon/index.js'
import { utils } from '../../utils/index.js'

const COUPON_LOOKUP_CACHE_PREFIX = 'coupon:lookup'
const COUPON_PUBLIC_LIST_CACHE_PREFIX = 'coupon:list'
const COUPON_SUPPORT_LIST_CACHE_PREFIX = 'coupon:support-list'

export const COUPON_CACHE_TTL_SECONDS = 60

function companyScope(companyId?: OrganizationBusCompanyId) {
    return companyId ? `company:${companyId}` : 'all'
}

export function couponLookupCachePrefix(companyId?: OrganizationBusCompanyId) {
    return `${COUPON_LOOKUP_CACHE_PREFIX}:${companyScope(companyId)}`
}

export function couponPublicListCachePrefix(companyId?: OrganizationBusCompanyId) {
    return `${COUPON_PUBLIC_LIST_CACHE_PREFIX}:${companyScope(companyId)}`
}

export function couponSupportListCachePrefix(companyId?: OrganizationBusCompanyId) {
    return `${COUPON_SUPPORT_LIST_CACHE_PREFIX}:${companyScope(companyId)}`
}

export function couponLookupCachePayload(params: CouponCheckCodeQuery) {
    return {
        id: params.id,
        code: params.code,
        companyId: params.companyId,
    }
}

function hydrateDate(value: unknown) {
    if (value === null || value === undefined) return null
    if (value instanceof Date) return value

    const date = new Date(String(value))
    return Number.isNaN(date.getTime()) ? null : date
}

export function hydrateCoupon<T extends CouponResponse>(coupon: T): T {
    return {
        ...coupon,
        startDate: hydrateDate(coupon.startDate),
        endDate: hydrateDate(coupon.endDate),
    } as T
}

export function hydrateCouponsResponse<T extends CouponsResponse>(response: T): T {
    return {
        ...response,
        coupons: response.coupons.map(hydrateCoupon),
    }
}

export async function clearCouponCache(companyId?: OrganizationBusCompanyId) {
    const patterns = [
        `${COUPON_LOOKUP_CACHE_PREFIX}:all:*`,
        `${COUPON_PUBLIC_LIST_CACHE_PREFIX}:all:*`,
        `${COUPON_SUPPORT_LIST_CACHE_PREFIX}:all:*`,
    ]

    if (companyId) {
        patterns.push(
            `${COUPON_LOOKUP_CACHE_PREFIX}:company:${companyId}:*`,
            `${COUPON_PUBLIC_LIST_CACHE_PREFIX}:company:${companyId}:*`,
            `${COUPON_SUPPORT_LIST_CACHE_PREFIX}:company:${companyId}:*`
        )
    } else {
        patterns.push(
            `${COUPON_LOOKUP_CACHE_PREFIX}:company:*`,
            `${COUPON_PUBLIC_LIST_CACHE_PREFIX}:company:*`,
            `${COUPON_SUPPORT_LIST_CACHE_PREFIX}:company:*`
        )
    }

    await Promise.all(patterns.map(pattern => utils.cache.delCacheByPattern(pattern)))
}
