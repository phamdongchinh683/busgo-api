import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { db } from '../../../datasource/db.js'
import { DriverQuery } from '../../../model/query/driver/index.js'
import { AUTH_USER_STATUS, AuthUserId, AuthUserRole } from '../user/type.js'
import { utils } from '../../../utils/index.js'
import { sql } from 'kysely'
import { PeriodUserQuery } from '../../../model/query/user/index.js'
import { AuthUserTableInsert } from './table.js'
import { UserListQuery } from '../../../model/body/user/index.js'

export async function findAllDrivers(query: DriverQuery, companyId: OrganizationBusCompanyId) {
    const { limit, next, phone, status } = query
    const rows = await db
        .selectFrom('auth.user as u')
        .innerJoin('organization.company_member as cm', 'cm.userId', 'u.id')
        .innerJoin('organization.bus_company as bc', 'bc.id', 'cm.companyId')
        .innerJoin('organization.driver_monthly_stat as dms', 'dms.driverId', 'u.id')
        .where(eb => {
            const cond = []
            cond.push(eb('u.role', '=', AuthUserRole.enum.driver))
            if (next) cond.push(eb('u.id', '>', next))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (status !== undefined) cond.push(eb('u.status', '=', status))
            if (companyId) cond.push(eb('cm.companyId', '=', companyId))
            return eb.and(cond)
        })
        .select([
            'u.id',
            'u.id',
            'u.firstName',
            'u.lastName',
            'u.email',
            'u.phone',
            'u.role',
            'u.status',
            'dms.cancelledTripCount',
            'dms.completedTripCount',
        ])
        .limit(limit + 1)
        .orderBy('u.id', 'asc')
        .execute()

    return rows
}

export async function insertOne(params: AuthUserTableInsert) {
    return db.insertInto('auth.user').values(params).returningAll().executeTakeFirstOrThrow()
}

export async function getPeriod(q: PeriodUserQuery) {
    const year = q.year ?? utils.time.getNow().year()

    const { start, end } = utils.time.getPeriodStartAndEnd(year)

    if (q.type === 'monthly') {
        const rows = await db
            .selectFrom('auth.user as u')
            .select([
                sql<number>`EXTRACT(MONTH FROM u.created_at)::int`.as('month'),
                sql<number>`count(*)::int`.as('count'),
            ])
            .where(eb => {
                const cond = []
                cond.push(eb('u.createdAt', '>=', start))
                cond.push(eb('u.createdAt', '<=', end))
                if (q.status !== undefined) cond.push(eb('u.status', '=', q.status))
                if (q.role) cond.push(eb('u.role', '=', q.role))
                return eb.and(cond)
            })
            .groupBy(sql`EXTRACT(MONTH FROM u.created_at)`)
            .orderBy(sql`EXTRACT(MONTH FROM u.created_at)`)
            .execute()

        return utils.time.normalizeMonthlySeries(
            rows.map(r => [r.month, r.count]),
            {
                maxMonthInclusive: utils.time.getMaxMonthInclusiveForPeriodYear(year),
            }
        )
    }

    const rows = await db
        .selectFrom('auth.user as u')
        .select([
            sql<number>`EXTRACT(YEAR FROM u.created_at)::int`.as('year'),
            sql<number>`count(*)::int`.as('total'),
        ])
        .where(eb => {
            const cond = []
            if (q.status !== undefined) cond.push(eb('u.status', '=', q.status))
            if (q.role) cond.push(eb('u.role', '=', q.role))
            return eb.and(cond)
        })
        .groupBy(sql`EXTRACT(YEAR FROM u.created_at)`)
        .orderBy(sql`EXTRACT(YEAR FROM u.created_at)`)
        .execute()

    return rows.map(r => [r.year, r.total])
}

export async function countAll() {
    const r = await db
        .selectFrom('auth.user')
        .select(sql<number>`count(*)::int`.as('total'))
        .executeTakeFirstOrThrow()
    return r.total
}

export function getOne(params: {
    email?: string
    phone?: string
    id?: AuthUserId
    facebookId?: string
    googleId?: string
}) {
    const { email, phone, id, facebookId, googleId } = params
    return db
        .selectFrom('auth.user as u')
        .selectAll()
        .where(eb => {
            const cond = []
            if (email) cond.push(eb('u.email', '=', email))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (id) cond.push(eb('u.id', '=', id))
            if (facebookId) cond.push(eb('u.facebookId', '=', facebookId))
            if (googleId) cond.push(eb('u.googleId', '=', googleId))
            return eb.and(cond)
        })
        .executeTakeFirst()
}

export async function findAll(query: UserListQuery) {
    const { limit, next, status, role, companyId, email, phone, type } = query
    const rows = await db
        .selectFrom('auth.user as u')
        .where(eb => {
            const cond = []
            cond.push(eb('u.role', '!=', AuthUserRole.enum.super_admin))
            if (role && role !== AuthUserRole.enum.super_admin) {
                cond.push(eb('u.role', '=', role))
            }
            if (status !== undefined) cond.push(eb('u.status', '=', status))
            if (companyId) {
                cond.push(eb('u.companyId', '=', companyId))
            }
            if (email) cond.push(eb('u.email', '=', email))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (type === 'facebook') cond.push(eb('u.facebookId', 'is not', null))
            if (type === 'google') cond.push(eb('u.googleId', 'is not', null))
            if (next) cond.push(eb('u.id', '>', next))
            return eb.and(cond)
        })
        .selectAll()
        .limit(limit + 1)
        .orderBy('u.id', 'asc')
        .execute()

    return rows
}

export function getCompanyStripeAccountId(companyId: OrganizationBusCompanyId) {
    return db
        .selectFrom('auth.user as u')
        .innerJoin('organization.company_member as cm', 'cm.userId', 'u.id')
        .select(['u.accountStripeId'])
        .where(eb => {
            const cond = []
            cond.push(eb('u.accountStripeId', 'is not', null))
            cond.push(eb('u.status', '=', AUTH_USER_STATUS.active))
            cond.push(eb('cm.companyId', '=', companyId))
            cond.push(eb('u.role', '=', AuthUserRole.enum.operator))
            return eb.and(cond)
        })
        .executeTakeFirstOrThrow()
}

export function findOneByEmailOrPhone(params: { email?: string; phone?: string }) {
    const { email, phone } = params

    return db
        .selectFrom('auth.user as u')
        .select(['u.id'])
        .where(eb => {
            const conditions = []

            if (email) {
                conditions.push(
                    eb.and([eb('u.email', '=', email), eb('u.isEmailVerified', '=', true)])
                )
            }

            if (phone) {
                conditions.push(
                    eb.and([eb('u.phone', '=', phone), eb('u.isPhoneVerified', '=', true)])
                )
            }

            return eb.or(conditions)
        })
        .executeTakeFirst()
}
