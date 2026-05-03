import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { ChatBoxId } from './type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { ChatBoxBody } from '../../../model/body/chat/index.js'

export async function createOne(params: { body: ChatBoxBody; createdBy: AuthUserId }) {
    const { body, createdBy } = params

    return db.transaction().execute(async trx => {
        const box = await trx
            .insertInto('chat.box')
            .values({
                title: body.title ?? null,
                createdBy,
                senderId: createdBy,
                receiverId: body.receiverId,
                lastMessage: body.message,
                lastMessageSenderId: createdBy,
                senderMessageCount: 1,
                receiverMessageCount: 0,
                unreadSenderCount: 0,
                unreadReceiverCount: 1,
            })
            .returningAll()
            .executeTakeFirstOrThrow()

        const message = await trx
            .insertInto('chat.message')
            .values({
                boxId: box.id,
                senderId: createdBy,
                body: body.message,
            })
            .returningAll()
            .executeTakeFirstOrThrow()

        await trx
            .updateTable('chat.box')
            .set({ lastMessage: message.body })
            .where('id', '=', box.id)
            .execute()

        return {
            boxId: box.id,
            title: box.title,
            senderId: box.senderId,
            receiverId: box.receiverId,
            body: message.body,
            createdAt: message.createdAt,
        }
    })
}

export async function markRead(boxId: ChatBoxId, viewerId: AuthUserId) {
    return db
        .updateTable('chat.box')
        .set({
            unreadReceiverCount: sql`CASE WHEN receiver_id = ${viewerId} THEN 0 ELSE unread_receiver_count END`,
            unreadSenderCount: sql`CASE WHEN sender_id = ${viewerId} THEN 0 ELSE unread_sender_count END`,
        })
        .where('id', '=', boxId)
        .where(eb => eb.or([eb('receiverId', '=', viewerId), eb('senderId', '=', viewerId)]))
        .returningAll()
        .executeTakeFirstOrThrow()
}
