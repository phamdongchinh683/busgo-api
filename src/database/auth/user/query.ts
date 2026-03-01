import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { DriverQuery } from '../../../model/query/driver/index.js'
import { AuthUserTableInsert } from './table.js'
import { AuthUserRole, AuthUserId } from './type.js'
import { UserListQuery } from '../../../model/body/user/index.js'
import { PeriodUserQuery } from '../../../model/query/user/index.js'
import { utils } from '../../../utils/index.js'

export async function insertOne(params: AuthUserTableInsert) {
    return db.insertInto('auth.user').values(params).returningAll().executeTakeFirstOrThrow()
}

export function getOne(params: {
    username?: string
    email?: string
    phone?: string
    id?: AuthUserId
}) {
    const { username, email, phone, id } = params
    return db
        .selectFrom('auth.user as u')
        .leftJoin('auth.staff_profile', 'u.id', 'auth.staff_profile.userId')
        .leftJoin('auth.staff_detail', 'u.id', 'auth.staff_detail.userId')
        .select([
            'u.id',
            'u.username',
            'u.fullName',
            'u.password',
            'u.email',
            'u.phone',
            'u.role',
            'u.status',
            'auth.staff_detail.companyId',
            'auth.staff_profile.role as staffProfileRole',
        ])
        .where(eb => {
            const cond = []
            if (username) cond.push(eb('u.username', '=', username))
            if (email) cond.push(eb('u.email', '=', email))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (id) cond.push(eb('u.id', '=', id))
            return eb.and(cond)
        })
        .executeTakeFirst()
}

export async function countAll() {
    const r = await db
        .selectFrom('auth.user')
        .select(sql<number>`count(*)::int`.as('total'))
        .executeTakeFirstOrThrow()
    return r.total
}

export async function findAllDrivers(query: DriverQuery) {
    const { limit, next, phone, status } = query
    return db
        .selectFrom('auth.user as u')
        .where(eb => {
            const cond = []
            cond.push(eb('u.role', '=', AuthUserRole.enum.driver))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (status) cond.push(eb('u.status', '=', status))
            if (next) cond.push(eb('u.id', '>', next))
            return eb.and(cond)
        })
        .select(['u.id', 'u.fullName', 'u.email', 'u.phone', 'u.role', 'u.status'])
        .limit(limit + 1)
        .orderBy('u.id', 'asc')
        .execute()
}

export function findAll(query: UserListQuery) {
    const { limit, next, status, role, companyId, email, phone } = query
    return db
        .selectFrom('auth.user as u')
        .leftJoin('auth.staff_profile as sp', 'sp.userId', 'u.id')
        .leftJoin('auth.staff_detail as sd', 'sd.userId', 'u.id')
        .where(eb => {
            const cond = []
            if (status) cond.push(eb('u.status', '=', status))
            if (role) cond.push(eb('u.role', '=', role))
            if (companyId) cond.push(eb('sd.companyId', '=', companyId))
            if (email) cond.push(eb('u.email', '=', email))
            if (phone) cond.push(eb('u.phone', '=', phone))
            if (next) cond.push(eb('u.id', '>', next))
            return eb.and(cond)
        })
        .select([
            'u.id',
            'u.username',
            'u.fullName',
            'u.email',
            'u.phone',
            'u.role',
            'u.status',
            'sp.role as staffProfileRole',
        ])
        .limit(limit + 1)
        .orderBy('u.id', 'asc')
        .execute()
}
export async function getPeriod(
    q: PeriodUserQuery
  ){

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
  
      return rows.map(r => [r.month, r.count])
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