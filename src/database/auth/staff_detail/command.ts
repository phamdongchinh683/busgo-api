import { db } from '../../../datasource/db.js'
import { AuthStaffDetailTableInsert, AuthStaffDetailTableUpdate } from './table.js'
import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import _ from 'lodash'
import { AuthUserId, AuthUserStatus } from '../user/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'

export async function upsertOne(params: AuthStaffDetailTableInsert, trx?: Transaction<Database>) {
    const data = _.omitBy(params, v => _.isNil(v)) as AuthStaffDetailTableInsert

    return (trx ?? db)
        .insertInto('auth.staff_detail')
        .values(data)
        .onConflict(oc => oc.column('userId').doUpdateSet(params))
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updateOne(
    userId: AuthUserId,
    params: AuthStaffDetailTableUpdate,
    trx?: Transaction<Database>
) {
    const data = _.omitBy(params, v => _.isNil(v)) as AuthStaffDetailTableUpdate
    return (trx ?? db)
        .updateTable('auth.staff_detail')
        .set(data)
        .where('userId', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function getOne(userId: AuthUserId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('auth.staff_detail')
        .selectAll()
        .where('userId', '=', userId)
        .executeTakeFirst()
}

export async function getOneByCompanyId(
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('auth.staff_detail')
        .select(['auth.staff_detail.email'])
        .where(eb => {
            const cond = []
            cond.push(eb('auth.staff_detail.companyId', '=', companyId))
            cond.push(eb('auth.staff_detail.status', '=', AuthUserStatus.enum.active))
            return eb.and(cond)
        })
        .orderBy(sql`random()`)
        .executeTakeFirstOrThrow()
}
