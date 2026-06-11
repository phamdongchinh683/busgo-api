import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { db } from '../../../datasource/db.js'
import { BusCompanyListQuery } from '../../../model/query/bus-company/index.js'
import { OrganizationBusCompanyId } from './type.js'

export async function findByNameOrHotline(
    name: string,
    hotline: string,
    trx?: Transaction<Database>
): Promise<{ id: OrganizationBusCompanyId } | undefined> {
    return (trx ?? db)
        .selectFrom('organization.bus_company')
        .select('id')
        .where(eb => eb.or([eb('name', '=', name), eb('hotline', '=', hotline)]))
        .executeTakeFirst()
}

export async function findAll(query: BusCompanyListQuery) {
    const { limit, next, name } = query
    return db
        .selectFrom('organization.bus_company as bc')
        .selectAll()
        .select(['bc.id as cursorId', 'bc.publicId as id'])
        .where(eb => {
            const cond = []
            if (name) cond.push(eb('bc.name', 'ilike', `%${name}%`))
            if (next) cond.push(eb('bc.id', '>', next))
            return eb.and(cond)
        })
        .limit(limit + 1)
        .orderBy('bc.id', 'asc')
        .execute()
}

export async function countAll() {
    const r = await db
        .selectFrom('organization.bus_company')
        .select(sql<number>`count(*)::int`.as('total'))
        .executeTakeFirstOrThrow()

    return Number(r.total)
}
