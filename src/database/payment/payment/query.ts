import { Transaction, sql } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { BookingId } from '../../booking/booking/type.js'
import { PaymentStatus } from './type.js'
import { db } from '../../../datasource/db.js'
import { PaymentFilter, PeriodPaymentQuery } from '../../../model/query/payment/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { utils } from '../../../utils/index.js'

export async function updatePaymentTransactionByCode(
    transactionCode: string,
    params: {
        status: PaymentStatus
        paidAt?: Date
        transactionNo?: string
        payDate?: string
    },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('payment.payment as pp')
        .set(params)
        .where('pp.transactionCode', '=', transactionCode)
        .returningAll()
        .execute()
}

export async function updateStatusPaymentTransaction(
    status: PaymentStatus,
    bookingId: BookingId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('payment.payment as pp')
        .set({ status })
        .where('pp.bookingId', '=', bookingId)
        .executeTakeFirstOrThrow()
}

export async function getPayment(
    bookingId?: BookingId,
    transactionCode?: string,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('payment.payment as pp')
        .innerJoin('booking.booking as b', 'b.id', 'pp.bookingId')
        .select([
            'pp.id',
            'pp.bookingId',
            'pp.amount',
            'pp.method',
            'pp.status',
            'pp.transactionCode',
            'pp.paidAt',
            'b.expiredAt',
        ])
        .where(eb => {
            const cond = []
            if (bookingId) cond.push(eb('pp.bookingId', '=', bookingId))
            if (transactionCode) cond.push(eb('pp.transactionCode', '=', transactionCode))
            return eb.and(cond)
        })
        .executeTakeFirst()
}

export async function getPaymentByBookingId(bookingId: BookingId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('payment.payment as pp')
        .where('pp.bookingId', '=', bookingId)
        .selectAll()
        .executeTakeFirst()
}

export async function getPayments(
    params: PaymentFilter,
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('payment.payment as pp')
        .innerJoin('booking.booking as b', 'b.id', 'pp.bookingId')
        .innerJoin('auth.user as u', 'u.id', 'b.userId')
        .select([
            'pp.id',
            'pp.bookingId',
            'pp.amount',
            'pp.method',
            'pp.status',
            'pp.transactionCode',
            'pp.paidAt',
            'b.expiredAt',
            'u.phone',
        ])
        .where(eb => {
            const cond = []
            if (params.transactionCode)
                cond.push(eb('pp.transactionCode', '=', params.transactionCode))
            if (params.status) cond.push(eb('pp.status', '=', params.status))
            if (params.method) cond.push(eb('pp.method', '=', params.method))
            cond.push(
                eb.exists(
                    eb
                        .selectFrom('booking.ticket as t')
                        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
                        .innerJoin('organization.vehicle as v', 'v.id', 'trip.vehicleId')
                        .select('t.id')
                        .whereRef('t.bookingId', '=', 'pp.bookingId')
                        .where('v.companyId', '=', companyId)
                )
            )
            return eb.and(cond)
        })
        .execute()
}

export async function getTotalRevenue(trx?: Transaction<Database>) {
    const r = await (trx ?? db)
        .selectFrom('payment.payment as pp')
        .where('pp.status', '=', PaymentStatus.enum.success)
        .select(sql<number>`coalesce(sum(${sql.ref('pp.amount')}), 0)`.as('total'))
        .executeTakeFirstOrThrow()
    return Number(r.total)
}

export async function getTotalRevenueByCompanyId(
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('payment.payment as pp')
        .where('pp.status', '=', PaymentStatus.enum.success)
        .where(eb =>
            eb.exists(
                eb
                    .selectFrom('booking.ticket as t')
                    .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
                    .innerJoin('organization.vehicle as v', 'v.id', 'trip.vehicleId')
                    .select('t.id')
                    .whereRef('t.bookingId', '=', 'pp.bookingId')
                    .where('v.companyId', '=', companyId)
            )
        )
        .select(sql<number>`coalesce(sum(${sql.ref('pp.amount')}), 0)`.as('total'))
        .executeTakeFirstOrThrow()
}

export async function getPeriodRevenue(q: PeriodPaymentQuery) {
    const year = q.year ?? utils.time.getNow().year()
    const { start, end } = utils.time.getPeriodStartAndEnd(year)

    const baseWhere = (eb: any) => {
        const cond = [eb('pp.paidAt', '>=', start), eb('pp.paidAt', '<=', end)]
        if (q.method) cond.push(eb('pp.method', '=', q.method))
        if (q.status) cond.push(eb('pp.status', '=', q.status))

        return eb.and(cond)
    }

    if (q.type === 'monthly') {
        const rows = await db
            .selectFrom('payment.payment as pp')
            .where(baseWhere)
            .select([
                sql<number>`EXTRACT(MONTH FROM pp.paid_at)::int`.as('month'),
                sql<number>`coalesce(sum(pp.amount), 0)::int`.as('total'),
            ])
            .groupBy(sql`EXTRACT(MONTH FROM pp.paid_at)`)
            .orderBy(sql`EXTRACT(MONTH FROM pp.paid_at)`)
            .execute()
        return rows.map(r => [r.month, r.total])
    }

    const r = await db
        .selectFrom('payment.payment as pp')
        .where(baseWhere)
        .select(sql<number>`coalesce(sum(pp.amount), 0)::int`.as('total'))
        .executeTakeFirstOrThrow()
    return [[year, r.total]]
}
