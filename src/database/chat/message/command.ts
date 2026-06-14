import _ from 'lodash'
import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../../auth/user/type.js'
import { ChatBoxId } from '../box/type.js'
import { ChatMessageId } from './type.js'
import { ChatMessageTableInsert } from './table.js'

export async function insertOne(params: ChatMessageTableInsert) {
    const data = _.omitBy(params, v => _.isNil(v)) as ChatMessageTableInsert

    const result = await db.transaction().execute(async trx => {
        await trx
            .selectFrom('chat.box as b')
            .select('b.id')
            .where('b.id', '=', params.boxId)
            .where(eb =>
                eb.or([
                    eb('b.senderId', '=', params.senderId),
                    eb('b.receiverId', '=', params.senderId),
                ])
            )
            .forUpdate('b')
            .executeTakeFirstOrThrow()

        const row = await trx
            .insertInto('chat.message')
            .values(data)
            .returningAll()
            .executeTakeFirstOrThrow()

        const box = await trx
            .updateTable('chat.box as b')
            .set({
                lastMessage: row.body,
                lastMessageSenderId: row.senderId,
                senderMessageCount: sql`b.sender_message_count + CASE WHEN b.sender_id = ${row.senderId} THEN 1 ELSE 0 END`,
                receiverMessageCount: sql`b.receiver_message_count + CASE WHEN b.receiver_id = ${row.senderId} THEN 1 ELSE 0 END`,
                unreadSenderCount: sql`b.unread_sender_count + CASE WHEN b.receiver_id = ${row.senderId} THEN 1 ELSE 0 END`,
                unreadReceiverCount: sql`b.unread_receiver_count + CASE WHEN b.sender_id = ${row.senderId} THEN 1 ELSE 0 END`,
            })
            .where('b.id', '=', row.boxId)
            .returning([
                'id',
                'senderId',
                'receiverId',
                'unreadSenderCount',
                'unreadReceiverCount',
                'lastMessage',
            ])
            .executeTakeFirstOrThrow()

        return { row, box }
    })

    return result
}

export async function updateOne(params: {
    id: ChatMessageId
    boxId: ChatBoxId
    senderId: AuthUserId
    body: string
}) {
    return db.transaction().execute(async trx => {
        const message = await trx
            .updateTable('chat.message')
            .set({ body: params.body })
            .where('id', '=', params.id)
            .where('boxId', '=', params.boxId)
            .where('senderId', '=', params.senderId)
            .returningAll()
            .executeTakeFirstOrThrow()

        const box = await trx
            .updateTable('chat.box')
            .set({
                lastMessage: params.body,
            })
            .where('id', '=', params.boxId)
            .returningAll()
            .executeTakeFirstOrThrow()

        return { message, box }
    })
}
