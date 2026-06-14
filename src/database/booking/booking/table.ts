import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { BookingId, BookingType, PaymentMethod, PaymentStatus } from './type.js'
import { BookingCouponId } from '../coupon/type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'

export interface BookingTable extends Timestamps {
    id: GeneratedAlways<BookingId>
    userId: AuthUserId
    couponId: BookingCouponId | null
    code: string
    bookingType: BookingType
    originalAmount: number
    discountAmount: number
    totalAmount: number
    expiredAt: Date | null
    companyId: OrganizationBusCompanyId
    method: PaymentMethod | null
    status: PaymentStatus | null
    transactionCode: string | null
    paidAt: Date | null
    payDate: string | null
    transactionNo: string | null
}

export type BookingTableInsert = Insertable<BookingTable>
export type BookingTableSelect = Selectable<BookingTable>
export type BookingTableUpdate = Updateable<BookingTable>
