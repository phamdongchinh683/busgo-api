import { Transaction, sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { Database } from '../../../datasource/type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { BookingId } from './type.js'
import { BookingTicketId } from '../ticket/type.js'
import { utils } from '../../../utils/index.js'
import { PeriodBookingQuery } from '../../../model/query/booking/index.js'

export async function countAll(trx?: Transaction<Database>) {
    const r = await (trx ?? db)
        .selectFrom('booking.booking')
        .select(sql<number>`count(*)::int`.as('total'))
        .executeTakeFirstOrThrow()
    return r.total
}

export async function getAmountByBookingId(bookingId: BookingId) {
    return db
        .selectFrom('booking.booking as b')
        .select('b.totalAmount')
        .where('b.id', '=', bookingId)
        .executeTakeFirstOrThrow()
}

export async function getBookingByUserIdAndBookingId(
    params: {
        userId: AuthUserId
        bookingId?: BookingId
        ticketId?: BookingTicketId
    },
    trx?: Transaction<Database>
) {
    const { userId, bookingId, ticketId } = params
    return (trx ?? db)
        .selectFrom('booking.booking as b')
        .innerJoin('booking.ticket as t', 't.bookingId', 'b.id')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .leftJoin('payment.payment as pp', 'pp.bookingId', 'b.id')
        .selectAll()
        .select([
            'b.status as bookingStatus',
            'trip.status as tripStatus',
            'trip.departureDate',
            'pp.method as paymentMethod',
            'pp.status as paymentStatus',
        ])
        .where(eb => {
            const cond = []
            cond.push(eb('b.userId', '=', userId))
            if (bookingId) cond.push(eb('b.id', '=', bookingId))
            if (ticketId) cond.push(eb('t.id', '=', ticketId))
            return eb.and(cond)
        })
        .executeTakeFirst()
}

export async function getBookingByTicketId(ticketId: BookingTicketId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('booking.booking as b')
        .innerJoin('booking.ticket as t', 't.bookingId', 'b.id')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .leftJoin('payment.payment as pp', 'pp.bookingId', 'b.id')
        .selectAll()
        .select([
            'b.status as bookingStatus',
            'trip.status as tripStatus',
            'trip.departureDate',
            'pp.method as paymentMethod',
            'pp.status as paymentStatus',
        ])
        .where('t.id', '=', ticketId)
        .executeTakeFirst()
}

export async function getPeriod(q: PeriodBookingQuery) {
    const year = q.year ?? utils.time.getNow().year()

    const { start, end } = utils.time.getPeriodStartAndEnd(year)

    if (q.type === 'monthly') {
        const rows = await db
            .selectFrom('booking.booking as b')
            .select([
                sql<number>`EXTRACT(MONTH FROM b.created_at)::int`.as('month'),
                sql<number>`count(*)::int`.as('count'),
            ])
            .where(eb => {
                const cond = []
                cond.push(eb('b.createdAt', '>=', start))
                cond.push(eb('b.createdAt', '<=', end))
                if (q.status) cond.push(eb('b.status', '=', q.status))
                return eb.and(cond)
            })
            .groupBy(sql`EXTRACT(MONTH FROM b.created_at)`)
            .orderBy(sql`EXTRACT(MONTH FROM b.created_at)`)
            .execute()

        return utils.time.normalizeMonthlySeries(
            rows.map(r => [r.month, r.count]),
            {
                maxMonthInclusive: utils.time.getMaxMonthInclusiveForPeriodYear(year),
            }
        )
    }

    const rows = await db
        .selectFrom('booking.booking as b')
        .select([
            sql<number>`EXTRACT(YEAR FROM b.created_at)::int`.as('year'),
            sql<number>`count(*)::int`.as('total'),
        ])
        .where(eb => {
            const cond = []
            if (q.status) cond.push(eb('b.status', '=', q.status))
            return eb.and(cond)
        })
        .groupBy(sql`EXTRACT(YEAR FROM b.created_at)`)
        .orderBy(sql`EXTRACT(YEAR FROM b.created_at)`)
        .execute()

    return rows.map(r => [r.year, r.total])
}
