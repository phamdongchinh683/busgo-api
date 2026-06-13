import { db } from '../../../datasource/db.js'
import { Database } from '../../../datasource/type.js'
import { Transaction } from 'kysely'
import { AuthUserId } from '../user/type.js'
import { AuthNotificationId } from './type.js'
import { AuthNotificationTableInsert } from './table.js'

export async function insertOne(params: AuthNotificationTableInsert, trx?: Transaction<Database>) {
    return (trx ?? db)
        .insertInto('auth.notification')
        .values(params)
        .returningAll()
        .executeTakeFirstOrThrow()
}

export async function markAsRead(
    id: AuthNotificationId,
    userId: AuthUserId,
    trx?: Transaction<Database>
) {
    return (trx ?? db)
        .updateTable('auth.notification')
        .set({ isRead: true })
        .where('id', '=', id)
        .where('userId', '=', userId)
        .returningAll()
        .executeTakeFirstOrThrow()
}
