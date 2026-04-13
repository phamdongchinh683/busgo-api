import { db } from '../../../datasource/db.js'
import { Database } from '../../../datasource/type.js'
import { Transaction } from 'kysely'
import { AuthUserDeviceTableInsert } from './table.js'
import { AuthUserDeviceId } from './type.js'
import { AuthUserId, AuthUserRole } from '../user/type.js'
import { OrganizationBusCompanyId } from '../../organization/bus_company/type.js'

export async function insertOne(params: AuthUserDeviceTableInsert, trx?: Transaction<Database>) {
    return (trx ?? db)
        .insertInto('auth.user_device')
        .values(params)
        .onConflict(oc =>
            oc.column('fcmToken').doUpdateSet({ userId: params.userId, fcmToken: params.fcmToken })
        )
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function deleteOne(id: AuthUserDeviceId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .deleteFrom('auth.user_device')
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function findBySuperAdmin(trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('auth.user_device as ud')
        .select(['ud.id', 'ud.userId', 'ud.fcmToken'])
        .innerJoin('auth.user', 'ud.userId', 'auth.user.id')
        .where('auth.user.role', '=', AuthUserRole.enum.super_admin)
        .execute()
}

export async function findByUserId(userId: AuthUserId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('auth.user_device as ud')
        .select(['ud.id', 'ud.userId', 'ud.fcmToken'])
        .where('ud.userId', '=', userId)
        .execute()
}
