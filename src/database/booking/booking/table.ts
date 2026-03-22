import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { BookingId, BookingStatus, BookingType } from './type.js'
import { BookingCouponId } from '../coupon/type.js'
import { AuthUserId } from '../../auth/user/type.js'

export interface BookingTable extends Timestamps {
    id: GeneratedAlways<BookingId>
    userId: AuthUserId
    couponId: BookingCouponId | null
    code: string
    bookingType: BookingType
    originalAmount: number
    discountAmount: number
    totalAmount: number
    status: BookingStatus
    expiredAt: Date | null
}

export type BookingTableInsert = Insertable<BookingTable>
export type BookingTableSelect = Selectable<BookingTable>
export type BookingTableUpdate = Updateable<BookingTable>
