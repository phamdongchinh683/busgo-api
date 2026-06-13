import { db } from '../../../datasource/db.js'
import { Database } from '../../../datasource/type.js'
import { sql, Transaction } from 'kysely'
import { AuthUserDeviceTableInsert } from './table.js'
import { AuthUserDeviceId } from './type.js'
import { AuthUserId, AuthUserRole } from '../user/type.js'

export async function insertOne(params: AuthUserDeviceTableInsert, trx?: Transaction<Database>) {
    return (trx ?? db)
        .insertInto('auth.user_device')
        .values(params)
        .onConflict(oc =>
            oc.column('fcmToken').doUpdateSet({ userId: params.userId, fcmToken: params.fcmToken })
        )
        .returningAll()
        .returning('id')
        .executeTakeFirstOrThrow()
}

export async function deleteOne(id: AuthUserDeviceId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .deleteFrom('auth.user_device')
        .where('id', '=', id)
        .returningAll()
        .returning('id')
        .executeTakeFirstOrThrow()
}

export async function findDeviceSuperAdmin(trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('auth.user_device as ud')
        .select(['ud.id', 'ud.userId', 'ud.fcmToken'])
        .innerJoin('auth.user', 'ud.userId', 'auth.user.id')
        .where('auth.user.role', '=', AuthUserRole.enum.super_admin)
        .orderBy(sql`random()`)
        .limit(1)
        .execute()
}

export async function findByUserId(userId: AuthUserId, trx?: Transaction<Database>) {
    return (trx ?? db)
        .selectFrom('auth.user_device as ud')
        .select(['ud.id', 'ud.userId', 'ud.fcmToken'])
        .where('ud.userId', '=', userId)
        .execute()
}
