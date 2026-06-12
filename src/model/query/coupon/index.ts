import z from 'zod'
import { BookingCouponId, BookingDiscountType } from '../../../database/booking/coupon/type.js'
import {
    OrganizationBusCompanyId,
    OrganizationBusCompanyPublicId,
} from '../../../database/organization/bus_company/type.js'
import { StatusFlag } from '../../common.js'

export const CouponCheckCodeQuery = z.object({
    code: z.string().optional(),
    id: BookingCouponId.optional(),
    companyId: OrganizationBusCompanyId.optional(),
    orderTotal: z.coerce.number(),
})
export type CouponCheckCodeQuery = z.infer<typeof CouponCheckCodeQuery>

export const CouponCheckCodeRequestQuery = CouponCheckCodeQuery.extend({
    companyId: OrganizationBusCompanyPublicId.optional(),
})
export type CouponCheckCodeRequestQuery = z.infer<typeof CouponCheckCodeRequestQuery>

export const CouponFilter = z.object({
    companyId: OrganizationBusCompanyId.optional(),
    next: BookingCouponId.optional(),
    orderTotal: z.coerce.number(),
})

export type CouponFilter = z.infer<typeof CouponFilter>

export const CouponRequestFilter = CouponFilter.extend({
    companyId: OrganizationBusCompanyPublicId.optional(),
})

export type CouponRequestFilter = z.infer<typeof CouponRequestFilter>

export const CouponSupportFilter = z.object({
    next: BookingCouponId.optional(),
    companyId: OrganizationBusCompanyId.optional(),
    limit: z.coerce.number().optional().default(10),
    date: z.coerce.date().optional(),
    type: BookingDiscountType.optional(),
    status: StatusFlag.optional().default(1),
})

export type CouponSupportFilter = z.infer<typeof CouponSupportFilter>

export const CouponBody = z.object({
    code: z.string().optional(),
    discountType: BookingDiscountType.optional(),
    discountValue: z.number().optional(),
    minOrderAmount: z.number().optional(),
    maxDiscountAmount: z.number().optional(),
    usedQuantity: z.number().optional(),
    totalQuantity: z.number().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isActive: z.boolean().optional(),
})

export type CouponBody = z.infer<typeof CouponBody>
