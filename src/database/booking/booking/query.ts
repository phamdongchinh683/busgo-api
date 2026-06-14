import { Transaction, sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { Database } from '../../../datasource/type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { BookingId, PaymentStatus } from './type.js'
import { BookingTicketId } from '../ticket/type.js'
import { utils } from '../../../utils/index.js'
import { PeriodBookingQuery } from '../../../model/query/booking/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { PeriodPaymentQuery, RevenueExportQuery } from '../../../model/query/payment/index.js'

export async function countAll(trx?: Transaction<Database>) {
    const r = await (trx ?? db)
        .selectFrom('booking.booking')
        .select(sql<number>`count(*)::int`.as('total'))
        .executeTakeFirstOrThrow()
    return r.total
}

export async function getAmountByBookingId(bookingId: BookingId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('booking.booking as b')
        .select('b.totalAmount')
        .where('b.id', '=', bookingId)
        .executeTakeFirstOrThrow()
}

export async function lockBookingForPayment(bookingId: BookingId, trx: Transaction<Database>) {
    return trx
        .selectFrom('booking.booking as b')
        .select('b.id')
        .where('b.id', '=', bookingId)
        .forUpdate('b')
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
        .selectAll()
        .select([
            'trip.status as tripStatus',
            'trip.departureDate',
            'b.method',
            'b.status',
            't.isRate',
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

export async function getBookingByTicketId(
    ticketId: BookingTicketId,
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('booking.booking as b')
        .innerJoin('booking.ticket as t', 't.bookingId', 'b.id')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('operation.trip_schedule as ts', 'ts.id', 'trip.scheduleId')
        .selectAll()
        .select(['b.status', 'trip.status as tripStatus', 'trip.departureDate', 'b.method'])
        .where('t.id', '=', ticketId)
        .where('ts.companyId', '=', companyId)
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

// --- Payment related (consolidated from former payment.payment table into booking) ---

export async function updatePaymentTransactionByCode(
    transactionCode: string,
    params: {
        status?: PaymentStatus
        paidAt?: Date
        transactionNo?: string
        payDate?: string
    },
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('booking.booking')
        .set({
            status: params.status ?? undefined,
            paidAt: params.paidAt ?? undefined,
            transactionNo: params.transactionNo ?? undefined,
            payDate: params.payDate ?? undefined,
        })
        .where('transactionCode', '=', transactionCode)
        .returningAll()
        .execute()
}

export async function getPayment(
    bookingId?: BookingId,
    transactionCode?: string,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('booking.booking as b')
        .selectAll()
        .where(eb => {
            const cond = []
            if (bookingId) cond.push(eb('b.id', '=', bookingId))
            if (transactionCode) cond.push(eb('b.transactionCode', '=', transactionCode))
            return eb.and(cond)
        })
        .executeTakeFirst()
}

export async function getPaymentByTransactionCodeForUpdate(
    transactionCode: string,
    trx: Transaction<Database>
) {
    return trx
        .selectFrom('booking.booking')
        .selectAll()
        .where('transactionCode', '=', transactionCode)
        .forUpdate()
        .executeTakeFirst()
}

export async function getCompanyIdByBookingId(bookingId: number, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('booking.ticket as t')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('organization.vehicle as v', 'v.id', 'trip.vehicleId')
        .select('v.companyId')
        .where('t.bookingId', '=', bookingId as any)
        .executeTakeFirst()
}

export async function getTotalRevenue(trx?: Transaction<Database>) {
    const r = await (trx ?? db)
        .selectFrom('booking.booking as b')
        .where('b.status', '=', PaymentStatus.enum.success)
        .select(sql<number>`coalesce(sum(${sql.ref('b.payment_amount')}), 0)`.as('total'))
        .executeTakeFirstOrThrow()
    return Number(r.total)
}

export async function getTotalRevenueByCompanyId(
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('booking.booking as b')
        .where('b.status', '=', PaymentStatus.enum.success)
        .where('b.companyId', '=', companyId)
        .select(sql<number>`coalesce(sum(${sql.ref('b.payment_amount')}), 0)`.as('total'))
        .executeTakeFirstOrThrow()
}

export async function getPeriodRevenue(q: PeriodPaymentQuery) {
    const year = q.year ?? utils.time.getNow().year()
    const { start, end } = utils.time.getPeriodStartAndEnd(year)

    const baseWhere = (eb: any) => {
        const cond = [eb('b.paidAt', '>=', start), eb('b.paidAt', '<=', end)]
        if (q.method) cond.push(eb('b.paymentMethod', '=', q.method))
        if (q.status) cond.push(eb('b.paymentStatus', '=', q.status))
        return eb.and(cond)
    }

    if (q.type === 'monthly') {
        const rows = await db
            .selectFrom('booking.booking as b')
            .where(baseWhere)
            .select([
                sql<number>`EXTRACT(MONTH FROM b.paid_at)::int`.as('month'),
                sql<number>`coalesce(sum(b.payment_amount), 0)::int`.as('total'),
            ])
            .groupBy(sql`EXTRACT(MONTH FROM b.paid_at)`)
            .orderBy(sql`EXTRACT(MONTH FROM b.paid_at)`)
            .execute()
        return utils.time.normalizeMonthlySeries(
            rows.map(r => [r.month, r.total]),
            {
                maxMonthInclusive: utils.time.getMaxMonthInclusiveForPeriodYear(year),
            }
        )
    }

    const r = await db
        .selectFrom('booking.booking as b')
        .where(baseWhere)
        .select(sql<number>`coalesce(sum(b.payment_amount), 0)::int`.as('total'))
        .executeTakeFirstOrThrow()
    return [[year, r.total]]
}

export type CompanyRevenueYearlyRow = {
    companyName: string
    total: number
}

export type CompanyRevenueMonthlyRow = {
    companyName: string
    months: number[]
    yearTotal: number
}

function companyRevenueExportJoin(q: RevenueExportQuery) {
    const year = q.year ?? utils.time.getNow().year()
    const { start, end } = utils.time.getPeriodStartAndEnd(year)

    return db
        .selectFrom('booking.booking as b')
        .innerJoin('organization.bus_company as bc', 'bc.id', 'b.companyId')
        .where('b.paidAt', '>=', start)
        .where('b.paidAt', '<=', end)
        .where('b.status', '=', PaymentStatus.enum.success)
        .where('b.method', '=', q.method)
}

export async function getRevenueByCompanyYearlyForPeriod(
    q: RevenueExportQuery
): Promise<CompanyRevenueYearlyRow[]> {
    return companyRevenueExportJoin(q)
        .select([
            'bc.name as companyName',
            sql<number>`coalesce(sum(b.payment_amount), 0)::int`.as('total'),
        ])
        .groupBy(['bc.id', 'bc.name'])
        .orderBy('bc.name', 'asc')
        .execute()
}

export async function getRevenueByCompanyMonthlyForPeriod(
    q: RevenueExportQuery
): Promise<CompanyRevenueMonthlyRow[]> {
    const year = q.year ?? utils.time.getNow().year()
    const maxMonthInclusive = utils.time.getMaxMonthInclusiveForPeriodYear(year)

    const monthSql = sql<number>`EXTRACT(MONTH FROM b.paid_at)::int`

    const rows = await companyRevenueExportJoin(q)
        .select([
            monthSql.as('month'),
            'bc.id as companyId',
            'bc.name as companyName',
            sql<number>`coalesce(sum(b.payment_amount), 0)::int`.as('total'),
        ])
        .groupBy([monthSql, 'bc.id', 'bc.name'])
        .execute()

    const map = new Map<number, { companyName: string; months: number[] }>()

    for (const r of rows) {
        const month = Number(r.month)
        if (month < 1 || month > 12 || month > maxMonthInclusive) {
            continue
        }

        const id = Number(r.companyId)
        const amt = Number(r.total)
        let entry = map.get(id)
        if (!entry) {
            entry = { companyName: r.companyName, months: Array(12).fill(0) }
            map.set(id, entry)
        }
        entry.months[month - 1] += amt
    }

    return [...map.entries()]
        .sort((a, b) => a[1].companyName.localeCompare(b[1].companyName))
        .map(([, v]) => {
            const yearTotal = v.months.reduce((s, x) => s + x, 0)
            return {
                companyName: v.companyName,
                months: v.months,
                yearTotal,
            }
        })
}
