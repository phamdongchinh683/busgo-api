import _ from 'lodash'
import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { ChatMessageTableInsert } from './table.js'

export async function insertOne(params: ChatMessageTableInsert) {
    const data = _.omitBy(params, v => _.isNil(v)) as ChatMessageTableInsert

    const result = await db.transaction().execute(async trx => {
        const row = await trx
            .insertInto('chat.message')
            .values(data)
            .returningAll()
            .executeTakeFirstOrThrow()

        const box = await trx
            .updateTable('chat.box as b')
            .set(eb => ({
                lastMessage: row.body,
                lastMessageSenderId: row.senderId,
                senderMessageCount: sql`b.sender_message_count + CASE WHEN b.sender_id = ${row.senderId} THEN 1 ELSE 0 END`,
                receiverMessageCount: sql`b.receiver_message_count + CASE WHEN b.receiver_id = ${row.senderId} THEN 1 ELSE 0 END`,
                unreadSenderCount: sql`b.unread_sender_count + CASE WHEN b.receiver_id = ${row.senderId} THEN 1 ELSE 0 END`,
                unreadReceiverCount: sql`b.unread_receiver_count + CASE WHEN b.sender_id = ${row.senderId} THEN 1 ELSE 0 END`,
            }))
            .where('b.id', '=', row.boxId)
            .returning(['id', 'senderId', 'receiverId', 'unreadSenderCount', 'unreadReceiverCount'])
            .executeTakeFirstOrThrow()

        return { row, box }
    })

    return result
}