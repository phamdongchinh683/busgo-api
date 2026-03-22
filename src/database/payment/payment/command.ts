import { Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { PaymentTableInsert } from './table.js'
import _ from 'lodash'
import { db } from '../../../datasource/db.js'
import { dal } from '../../index.js'
import { PaymentStatus } from './type.js'
import { utils } from '../../../utils/index.js'
import { BookingId, BookingStatus } from '../../booking/booking/type.js'
import { BookingTicketStatus } from '../../booking/ticket/type.js'

export async function createPaymentTransaction(
    params: PaymentTableInsert,
    trx: Transaction<Database>
) {
    const data = _.omitBy(params, v => _.isNil(v)) as PaymentTableInsert

    return trx.insertInto('payment.payment').values(data).returningAll().executeTakeFirstOrThrow()
}

export async function upsertPayment(params: PaymentTableInsert) {
    const data = _.omitBy(params, v => _.isNil(v)) as PaymentTableInsert
    return db
        .insertInto('payment.payment')
        .values(data)
        .onConflict(oc => oc.column('bookingId').doUpdateSet(data))
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updatePaymentStatusSuccess(
    transactionCode: string,
    transactionNo: string,
    payDate: string,
    trx: Transaction<Database>
) {
    const payment = await dal.payment.payment.query.updatePaymentTransactionByCode(
        transactionCode,
        {
            status: PaymentStatus.enum.success,
            paidAt: utils.time.getNow().toDate(),
            payDate,
            transactionNo,
        },
        trx
    )

    const booking = await dal.booking.booking.cmd.updateBookingStatus(
        payment[0].bookingId,
        BookingStatus.enum.paid,
        trx
    )

    if (booking[0].couponId !== null) {
        await dal.booking.coupon.cmd.upCountUsedQuantity(booking[0].couponId, '+', trx)
    }

    await dal.booking.ticket.cmd.updateTicketStatusByBookingId(
        {
            id: payment[0].bookingId,
            status: BookingTicketStatus.enum.paid,
        },
        trx
    )
}

export async function updatePaymentStatusFailed(
    transactionCode: string,
    tx: Transaction<Database>
) {
    const payment = await dal.payment.payment.query.updatePaymentTransactionByCode(
        transactionCode,
        {
            status: PaymentStatus.enum.failed,
        },
        tx
    )

    await dal.booking.booking.cmd.updateBookingStatus(
        payment[0].bookingId,
        BookingStatus.enum.cancelled,
        tx
    )

    const ticket = await dal.booking.ticket.cmd.updateTicketStatusByBookingId(
        {
            id: payment[0].bookingId,
            status: BookingTicketStatus.enum.cancelled,
        },
        tx
    )
    for (const t of ticket) {
        await dal.booking.seatSegment.cmd.deleteByTicketId(t.id, tx)
    }
}

export async function updatePaymentStatusByBookingId(
    params: {
        id: BookingId
        status: PaymentStatus
    },
    trx: Transaction<Database>
) {
    const { id, status } = params
    return trx
        .updateTable('payment.payment as pm')
        .set({ status })
        .where('pm.bookingId', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updatePaymentByTransactionCode(transactionCode: string) {
    return db.transaction().execute(async tx => {
        await dal.payment.payment.cmd.updatePaymentStatusFailed(transactionCode, tx)
        return { message: 'OK' }
    })
}
