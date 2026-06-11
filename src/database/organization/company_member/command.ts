import _ from 'lodash'
import { sql, Transaction } from 'kysely'
import { db } from '../../../datasource/db.js'
import { Database } from '../../../datasource/type.js'
import { AuthUserId, AuthUserRole, AuthUserStatus } from '../../auth/user/type.js'
import { OrganizationBusCompanyId } from '../bus_company/type.js'
import {
    OrganizationCompanyMemberTableInsert,
    OrganizationCompanyMemberTableUpdate,
} from './table.js'

export async function upsertOne(
    params: OrganizationCompanyMemberTableInsert,
    trx?: Transaction<Database>
) {
    const data = _.omitBy(params, v => _.isNil(v)) as OrganizationCompanyMemberTableInsert
    return (trx ?? db)
        .insertInto('organization.company_member')
        .values(data)
        .onConflict(oc => oc.column('userId').doUpdateSet(data))
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function updateOne(
    userId: AuthUserId,
    companyId: OrganizationBusCompanyId,
    params: OrganizationCompanyMemberTableUpdate,
    trx?: Transaction<Database>
) {
    const data = _.omitBy(params, v => _.isNil(v))

    return (trx ?? db)
        .updateTable('organization.company_member')
        .set(data)
        .where('userId', '=', userId)
        .where('companyId', '=', companyId)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function getOne(userId: AuthUserId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('organization.company_member as cm')
        .innerJoin('auth.user as u', 'cm.userId', 'u.id')
        .selectAll('cm')
        .select(['u.accountStripeId'])
        .where('cm.userId', '=', userId)
        .executeTakeFirst()
}

export async function getOneByCompanyId(
    companyId: OrganizationBusCompanyId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .selectFrom('organization.company_member as cm')
        .innerJoin('auth.user as u', 'cm.userId', 'u.id')
        .selectAll('cm')
        .where(eb => {
            const cond = []
            cond.push(eb('cm.companyId', '=', companyId))
            cond.push(eb('u.status', '=', AuthUserStatus.enum.active))
            cond.push(eb('u.role', '=', AuthUserRole.enum.operator_admin))
            return eb.and(cond)
        })
        .orderBy(sql`random()`)
        .executeTakeFirstOrThrow()
}
