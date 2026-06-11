import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { BookingCouponId, BookingCouponPublicId, BookingDiscountType } from './type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'

export interface BookingCouponTable extends Timestamps {
    id: GeneratedAlways<BookingCouponId>
    publicId: GeneratedAlways<BookingCouponPublicId>
    code: string
    discountType: BookingDiscountType
    discountValue: number
    minOrderAmount: number
    maxDiscountAmount: number
    totalQuantity: number
    usedQuantity: number
    startDate: Date | null
    endDate: Date | null
    isActive: boolean
    companyId: OrganizationBusCompanyId
}

export type BookingCouponTableInsert = Insertable<BookingCouponTable>
export type BookingCouponTableSelect = Selectable<BookingCouponTable>
export type BookingCouponTableUpdate = Updateable<BookingCouponTable>
