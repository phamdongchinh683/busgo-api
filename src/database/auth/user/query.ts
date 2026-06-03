import { CompanyAdminQuery } from '../../../model/query/company-admin/index.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { AuthStaffProfileRole } from '../staff_profile/type.js'
import { db } from '../../../datasource/db.js'
import { DriverQuery } from '../../../model/query/driver/index.js'
import { AuthUserId, AuthUserRole } from '../user/type.js'
import { utils } from '../../../utils/index.js'
import { sql } from 'kysely'
import { PeriodUserQuery } from '../../../model/query/user/index.js'
import { AuthUserTableInsert } from './table.js'
import { UserListQuery } from '../../../model/body/user/index.js'

export async function findAllCompanyAdmins(query: CompanyAdminQuery) {
    const { limit, next } = query
    return db
        .selectFrom('auth.user as u')
        .innerJoin('auth.staff_profile as sp', 'sp.userId', 'u.id')
        .leftJoin('organization.bus_company as bc', 'bc.id', 'sp.companyId')
        .where(eb => {
            const cond = []
            cond.push(eb('sp.role', '=', AuthStaffProfileRole.enum.company_admin))
            if (next) cond.push(eb('u.id', '>', next))
            return eb.and(cond)
        })
        .select([
            'u.id',
            'u.fullName',
            'u.email',
            'u.phone',
            'u.status',
            'sp.role',
            'sp.companyId',
            'bc.name as companyName',
        ])
        .limit(limit + 1)
        .orderBy('u.id', 'asc')
        .execute()
}

export async function findAllDrivers(query: DriverQuery, companyId: OrganizationBusCompanyId) {
    const { limit, next, phone, status } = query
    return db

        .selectFrom('auth.user as u')
        .innerJoin('organization.company_driver as cd', 'cd.userId', 'u.id')
        .innerJoin('organization.bus_company as bc', 'bc.id', 'cd.companyId')
        .innerJoin('organization.driver_monthly_stat as dms', 'dms.driverId', 'u.id')
        .where(eb => {
            const cond = []
            cond.push(eb('u.role', '=', AuthUserRole.enum.driver))
            if (next) cond.push(eb('u.id', '>', next))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (status) cond.push(eb('u.status', '=', status))
            if (companyId) cond.push(eb('cd.companyId', '=', companyId))
            return eb.and(cond)
        })
        .select([
            'u.id',
            'u.fullName',
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
            .leftJoin('auth.staff_profile as sp', 'sp.userId', 'u.id')
            .select([
                sql<number>`EXTRACT(MONTH FROM u.created_at)::int`.as('month'),
                sql<number>`count(*)::int`.as('count'),
            ])
            .where(eb => {
                const cond = []
                cond.push(eb('u.createdAt', '>=', start))
                cond.push(eb('u.createdAt', '<=', end))
                if (q.status) cond.push(eb('u.status', '=', q.status))
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
        .leftJoin('auth.staff_profile as sp', 'sp.userId', 'u.id')
        .select([
            sql<number>`EXTRACT(YEAR FROM u.created_at)::int`.as('year'),
            sql<number>`count(*)::int`.as('total'),
        ])
        .where(eb => {
            const cond = []
            if (q.status) cond.push(eb('u.status', '=', q.status))
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
        .leftJoin('auth.staff_profile', 'u.id', 'auth.staff_profile.userId')
        .leftJoin('organization.company_driver', 'u.id', 'organization.company_driver.userId')
        .select([
            'u.id',
            'u.fullName',
            'u.password',
            'u.email',
            'u.phone',
            'u.facebookId',
            'u.googleId',
            'u.role',
            'u.status',
            'u.tokenVersion',
            'u.accountStripeId',
            'u.isEmailVerified',
            'u.lastChangeContact',
            'auth.staff_profile.companyId',
            'auth.staff_profile.role as staffProfileRole',
            'organization.company_driver.companyId as driverCompanyId',
        ])
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

export async function getAuthUser(params: {
    email?: string
    phone?: string
    id?: AuthUserId
    facebookId?: string
    googleId?: string
}) {
    const { email, phone, id, facebookId, googleId } = params

    if (!email && !phone && !id && !facebookId && !googleId) {
        return undefined
    }

    return db
        .selectFrom('auth.user as u')
        .select([
            'u.id',
            'u.fullName',
            'u.password',
            'u.email',
            'u.phone',
            'u.facebookId',
            'u.googleId',
            'u.role',
            'u.status',
            'u.tokenVersion',
            'u.accountStripeId',
            'u.isEmailVerified',
            'u.lastChangeContact',
        ])
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

export function findAll(query: UserListQuery) {
    const {
        limit,
        next,
        status,
        role,
        companyId,
        email,
        phone,
        type
    } = query
    return db
        .selectFrom('auth.user as u')
        .leftJoin('auth.staff_profile as sp', 'sp.userId', 'u.id')
        .leftJoin('organization.company_driver as cd', 'cd.userId', 'u.id')
        .where(eb => {
            const cond = []
            cond.push(eb('u.role', '!=', AuthUserRole.enum.super_admin))
            if (role && role !== AuthUserRole.enum.super_admin) {
                cond.push(eb('u.role', '=', role))
            }
            if (status) cond.push(eb('u.status', '=', status))
            if (companyId) {
                cond.push(
                    eb.or([eb('sp.companyId', '=', companyId), eb('cd.companyId', '=', companyId)])
                )
            }
            if (email) cond.push(eb('u.email', '=', email))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (type === 'facebook') cond.push(eb('u.facebookId', 'is not', null))
            if (type === 'google') cond.push(eb('u.googleId', 'is not', null))
            if (next) cond.push(eb('u.id', '>', next))
            return eb.and(cond)
        })
        .select([
            'u.id',
            'u.fullName',
            'u.email',
            'u.phone',
            'u.facebookId',
            'u.googleId',
            'u.role',
            'u.status',
            'sp.role as staffProfileRole',
        ])
        .limit(limit + 1)
        .orderBy('u.id', 'asc')
        .execute()
}

export function getCompanyStripeAccountId(companyId: OrganizationBusCompanyId) {
    return db
        .selectFrom('auth.user as u')
        .innerJoin('auth.staff_profile as sp', 'sp.userId', 'u.id')
        .select(['u.accountStripeId'])
        .where(eb => {
            const cond = []
            cond.push(eb('u.accountStripeId', 'is not', null))
            cond.push(eb('u.status', '=', 'active'))
            cond.push(eb('sp.companyId', '=', companyId))
            cond.push(eb('sp.role', '=', AuthStaffProfileRole.enum.company_admin))
            return eb.and(cond)
        })
        .executeTakeFirstOrThrow()
}
