import { Transaction, sql } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { BookingId } from '../../booking/booking/type.js'
import { PaymentStatus } from './type.js'
import { db } from '../../../datasource/db.js'
import {
    PaymentFilter,
    PeriodPaymentQuery,
    RevenueExportQuery,
} from '../../../model/query/payment/index.js'
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

export async function getCompanyIdByBookingId(bookingId: BookingId) {
    return db
        .selectFrom('booking.ticket as t')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('organization.vehicle as v', 'v.id', 'trip.vehicleId')
        .select('v.companyId')
        .where('t.bookingId', '=', bookingId)
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
        return utils.time.normalizeMonthlySeries(
            rows.map(r => [r.month, r.total]),
            {
                maxMonthInclusive: utils.time.getMaxMonthInclusiveForPeriodYear(year),
            }
        )
    }

    const r = await db
        .selectFrom('payment.payment as pp')
        .where(baseWhere)
        .select(sql<number>`coalesce(sum(pp.amount), 0)::int`.as('total'))
        .executeTakeFirstOrThrow()
    return [[year, r.total]]
}

export type CompanyRevenueYearlyRow = {
    companyName: string
    total: number
}

export type CompanyRevenueMonthlyRow = {
    companyName: string
    /** index 0 = January … 11 = December */
    months: number[]
    yearTotal: number
}

function companyRevenueExportJoin(q: RevenueExportQuery) {
    const year = q.year ?? utils.time.getNow().year()
    const { start, end } = utils.time.getPeriodStartAndEnd(year)

    return db
        .selectFrom('payment.payment as pp')
        .innerJoin('booking.booking as b', 'b.id', 'pp.bookingId')
        .innerJoin('booking.ticket as t', 't.bookingId', 'b.id')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('organization.vehicle as v', 'v.id', 'trip.vehicleId')
        .innerJoin('organization.bus_company as bc', 'bc.id', 'v.companyId')
        .where('pp.paidAt', '>=', start)
        .where('pp.paidAt', '<=', end)
        .where('pp.status', '=', PaymentStatus.enum.success)
        .where('pp.method', '=', q.method)
}

export async function getRevenueByCompanyYearlyForPeriod(
    q: RevenueExportQuery
): Promise<CompanyRevenueYearlyRow[]> {
    const rows = await companyRevenueExportJoin(q)
        .select([
            'pp.id as paymentId',
            'pp.amount as paymentAmount',
            'bc.id as companyId',
            'bc.name as companyName',
        ])
        .groupBy(['pp.id', 'pp.amount', 'bc.id', 'bc.name'])
        .execute()

    const map = new Map<number, CompanyRevenueYearlyRow>()
    for (const r of rows) {
        const id = Number(r.companyId)
        const amt = Number(r.paymentAmount)
        const existing = map.get(id)
        if (existing) {
            existing.total += amt
        } else {
            map.set(id, {
                companyName: r.companyName,
                total: amt,
            })
        }
    }

    return [...map.values()].sort((a, b) => a.companyName.localeCompare(b.companyName))
}

export async function getRevenueByCompanyMonthlyForPeriod(
    q: RevenueExportQuery
): Promise<CompanyRevenueMonthlyRow[]> {
    const year = q.year ?? utils.time.getNow().year()
    const maxMonthInclusive = utils.time.getMaxMonthInclusiveForPeriodYear(year)

    const monthSql = sql<number>`EXTRACT(MONTH FROM pp.paid_at)::int`

    const rows = await companyRevenueExportJoin(q)
        .select([
            monthSql.as('month'),
            'pp.id as paymentId',
            'pp.amount as paymentAmount',
            'bc.id as companyId',
            'bc.name as companyName',
        ])
        .groupBy([monthSql, 'pp.id', 'pp.amount', 'bc.id', 'bc.name'])
        .execute()

    const map = new Map<number, { companyName: string; months: number[] }>()

    for (const r of rows) {
        const month = Number(r.month)
        if (month < 1 || month > 12 || month > maxMonthInclusive) {
            continue
        }

        const id = Number(r.companyId)
        const amt = Number(r.paymentAmount)
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
