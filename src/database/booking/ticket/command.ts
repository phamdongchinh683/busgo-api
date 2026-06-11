import { Transaction } from 'kysely'
import { BookingTicketTableInsert } from './table.js'
import { Database } from '../../../datasource/type.js'
import _ from 'lodash'
import { BookingTicketId, BookingTicketStatus } from './type.js'
import { BookingId, BookingStatus } from '../booking/type.js'
import { db } from '../../../datasource/db.js'
import { dal } from '../../index.js'
import { PaymentMethod, PaymentStatus } from '../../payment/payment/type.js'
import { OperationTripId } from '../../operation/trip/type.js'
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

export async function updateTicketStatusByBookingId(
    params: {
        id: BookingId
        status: BookingTicketStatus
    },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('booking.ticket as t')
        .set({ status: params.status })
        .where('t.bookingId', '=', params.id)
        .returningAll()
        .returning(['t.id as internalId', 't.publicId as id'])
        .execute()
}

export async function updateTicketStatus(
    params: { id: BookingTicketId; status: BookingTicketStatus; tripId?: OperationTripId },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('booking.ticket as t')
        .set({ status: params.status })
        .where(eb => {
            const cond = []
            cond.push(eb('t.id', '=', params.id))
            if (params.tripId) {
                cond.push(eb('t.tripId', '=', params.tripId))
            }
            return eb.and(cond)
        })
        .returningAll()
        .returning(['t.id as internalId', 't.publicId as id'])
        .executeTakeFirstOrThrow()
}

export async function cancelTicketTransaction(id: BookingTicketId) {
    return db.transaction().execute(async trx => {
        const ticket = await dal.booking.ticket.cmd.updateTicketStatus(
            { id, status: BookingTicketStatus.enum.cancelled },
            trx
        )

        const tickets = await dal.booking.ticket.cmd.updateTicketStatusByBookingId(
            {
                id: ticket.bookingId,
                status: BookingTicketStatus.enum.cancelled,
            },
            trx
        )

        await dal.booking.seatSegment.cmd.deleteByTicketIds(
            tickets.map(t => t.internalId),
            trx
        )

        await dal.booking.booking.cmd.updateBookingStatus(
            ticket.bookingId,
            BookingStatus.enum.cancelled,
            trx
        )

        await handlePaymentCancellation(trx, ticket.bookingId)

        return tickets
    })
}

export async function updateStatusTicket(params: {
    id: BookingTicketId
    status: BookingTicketStatus
    tripId?: OperationTripId
}) {
    return db.transaction().execute(async trx => {
        const ticket = await dal.booking.ticket.cmd.updateTicketStatus(
            { id: params.id, status: params.status, tripId: params.tripId },
            trx
        )
        if (ticket.status === BookingTicketStatus.enum.checked_in) {
            await dal.booking.booking.cmd.updateBookingStatus(
                ticket.bookingId,
                BookingStatus.enum.paid,
                trx
            )
            await dal.payment.payment.cmd.updatePaymentStatusByBookingId(
                { id: ticket.bookingId, status: PaymentStatus.enum.success },
                trx
            )
        } else if (ticket.status === BookingTicketStatus.enum.cancelled) {
            await dal.booking.booking.cmd.updateBookingStatus(
                ticket.bookingId,
                BookingStatus.enum.cancelled,
                trx
            )
            await dal.payment.payment.cmd.updatePaymentStatusByBookingId(
                { id: ticket.bookingId, status: PaymentStatus.enum.failed },
                trx
            )
        }
        return ticket
    })
}

async function handlePaymentCancellation(trx: Transaction<Database>, bookingId: BookingId) {
    const payment = await dal.payment.payment.query.getPayment(bookingId, undefined, trx)

    if (payment?.status === PaymentStatus.enum.pending) {
        await dal.payment.payment.query.updateStatusPaymentTransaction(
            PaymentStatus.enum.failed,
            bookingId,
            trx
        )
        return
    }

    if (!payment || payment.status !== PaymentStatus.enum.success) {
        return
    }

    if (payment.method === PaymentMethod.enum.vnpay) {
        await dal.payment.payment.query.updateStatusPaymentTransaction(
            PaymentStatus.enum.refunded,
            bookingId,
            trx
        )
    }

    if (payment.method === PaymentMethod.enum.stripe) {
        await service.stripe.client.createRefund({
            paymentIntentId: payment.transactionNo ?? '',
        })

        await dal.payment.payment.query.updateStatusPaymentTransaction(
            PaymentStatus.enum.refunded,
            bookingId,
            trx
        )
    }
}
