import { Transaction } from 'kysely'
import { BookingTicketTableInsert } from './table.js'
import { Database } from '../../../datasource/type.js'
import _ from 'lodash'
import { BookingTicketId, TicketStatus } from './type.js'
import { BookingId } from '../booking/type.js'
import { db } from '../../../datasource/db.js'
import { dal } from '../../index.js'
import { PaymentMethod, PaymentStatus } from '../booking/type.js'
import { service } from '../../../service/index.js'

export async function createTicketTransaction(
    params: BookingTicketTableInsert,
    trx: Transaction<Database>
) {
    const data = _.omitBy(params, v => _.isNil(v)) as BookingTicketTableInsert

    return trx.insertInto('booking.ticket').values(data).returningAll().executeTakeFirstOrThrow()
}

export async function insertManyTicketsTransaction(
    params: BookingTicketTableInsert[],
    trx: Transaction<Database>
) {
    return trx.insertInto('booking.ticket').values(params).returningAll().execute()
}

export async function cancelTicketTransaction(id: BookingTicketId) {
    return db.transaction().execute(async trx => {
        const ticket = await trx
            .selectFrom('booking.ticket as t')
            .select(['t.id', 't.bookingId', 't.status'])
            .where('t.id', '=', id)
            .executeTakeFirstOrThrow()

        const completedTickets = await trx
            .selectFrom('booking.ticket as t')
            .where('t.bookingId', '=', ticket.bookingId)
            .where('t.status', '=', TicketStatus.enum.completed)
            .execute()

        if (completedTickets.length > 0) {
            throw new Error('Không thể hủy vé khi đã có vé trong chuyến đi đã hoàn thành.');
        }

        const ticketsToCancel = [ticket];

        await dal.booking.seatSegment.cmd.deleteByTicketIds(
            ticketsToCancel.map(t => t.id),
            trx
        )

        await handlePaymentCancellation(trx, ticket.bookingId)

        return ticketsToCancel
    })
}

export async function updateStatusTicket(params: { id: BookingId; status: PaymentStatus }) {
    return dal.booking.booking.cmd.updatePaymentStatusByBookingId({
        id: params.id,
        status: params.status,
    })
}

async function handlePaymentCancellation(trx: Transaction<Database>, bookingId: BookingId) {
    const payment = await dal.booking.booking.query.getPayment(bookingId, undefined, trx)

    if (payment?.status === PaymentStatus.enum.pending) {
        await dal.booking.booking.cmd.updatePaymentStatusByBookingId(
            {
                status: PaymentStatus.enum.failed,
                id: bookingId,
            },
            trx
        )
        return
    }

    if (!payment || payment.status !== PaymentStatus.enum.success) {
        return
    }

    if (payment.method === PaymentMethod.enum.vnpay) {
        await dal.booking.booking.cmd.updatePaymentStatusByBookingId(
            {
                status: PaymentStatus.enum.refunded,
                id: bookingId,
            },
            trx
        )
    }

    if (payment.method === PaymentMethod.enum.stripe) {
        await service.stripe.client.createRefund({
            paymentIntentId: payment.transactionNo ?? '',
        })

        await dal.booking.booking.cmd.updatePaymentStatusByBookingId(
            {
                status: PaymentStatus.enum.refunded,
                id: bookingId,
            },
            trx
        )
    }
}
