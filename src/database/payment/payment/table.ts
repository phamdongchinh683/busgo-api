import { GeneratedAlways, Insertable, Selectable, Updateable } from 'kysely'
import { Timestamps } from '../../../datasource/helpers/common.js'
import { PaymentId, PaymentMethod, PaymentPublicId, PaymentStatus } from './type.js'
import { BookingId } from '../../booking/booking/type.js'

export interface PaymentTable extends Timestamps {
    id: GeneratedAlways<PaymentId>
    publicId: GeneratedAlways<PaymentPublicId>
    bookingId: BookingId
    amount: number
    method: PaymentMethod | null
    status: PaymentStatus
    transactionCode: string
    paidAt: Date | null
    payDate: string | null
    transactionNo: string | null
}

export type PaymentTableInsert = Insertable<PaymentTable>
export type PaymentTableSelect = Selectable<PaymentTable>
export type PaymentTableUpdate = Updateable<PaymentTable>
