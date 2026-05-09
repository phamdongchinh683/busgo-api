import { AuthStaffProfileTableInsert, AuthStaffProfileTableUpdate } from './table.js'
import { sql, Transaction } from 'kysely'
import { Database } from '../../../datasource/type.js'
import { db } from '../../../datasource/db.js'
import { AuthUserId, AuthUserStatus } from '../user/type.js'
import _ from 'lodash'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'
import { AuthStaffProfileRole } from './type.js'

export async function upsertOne(params: AuthStaffProfileTableInsert, trx?: Transaction<Database>) {
    const data = _.omitBy(params, v => _.isNil(v)) as AuthStaffProfileTableInsert
    return (trx ?? db)
        .insertInto('auth.staff_profile')
        .values(data)
        .onConflict(oc => oc.column('userId').doUpdateSet(data))
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updateOne(
    id: AuthUserId,
    params: AuthStaffProfileTableUpdate,
    trx?: Transaction<Database>
) {
    const data = _.omitBy(params, v => _.isNil(v))

    return (trx ?? db)
        .updateTable('auth.staff_profile')
        .set(data)
        .where('userId', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function getOne(userId: AuthUserId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('auth.staff_profile')
        .innerJoin('auth.user', 'auth.staff_profile.userId', 'auth.user.id')
        .selectAll()
        .select(['auth.user.accountStripeId'])
        .where('userId', '=', userId)
        .executeTakeFirst()
}

export async function getOneByCompanyId(
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('auth.staff_profile')
        .selectAll()
        .where(eb => {
            const cond = []
            cond.push(eb('auth.staff_profile.companyId', '=', companyId))
            cond.push(eb('auth.staff_profile.status', '=', AuthUserStatus.enum.active))
            cond.push(eb('auth.staff_profile.role', '=', AuthStaffProfileRole.enum.company_admin))
            return eb.and(cond)
        })
        .orderBy(sql`random()`)
        .executeTakeFirstOrThrow()
}
