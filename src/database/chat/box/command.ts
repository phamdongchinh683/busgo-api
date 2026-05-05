import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { ChatBoxId } from './type.js'
import { AuthUserId } from '../../auth/user/type.js'
import { ChatBoxBody } from '../../../model/body/chat/index.js'
import { utils } from '../../../utils/index.js'

export async function createOne(params: { body: ChatBoxBody; createdBy: AuthUserId }) {
    const { body, createdBy } = params

    return db.transaction().execute(async trx => {
        const box = await trx
            .insertInto('chat.box')
            .values({
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
            .onConflict(oc =>
                oc
                    .expression(sql`LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)`)
                    .doUpdateSet(eb => ({
                        lastMessage: body.message,
                        lastMessageSenderId: createdBy,
                        unreadReceiverCount: sql`
                        CASE 
                            WHEN chat.box.sender_id = ${createdBy} 
                            THEN chat.box.unread_receiver_count + 1
                            ELSE chat.box.unread_receiver_count
                        END
                    `,
                        unreadSenderCount: sql`
                        CASE 
                            WHEN chat.box.receiver_id = ${createdBy} 
                            THEN chat.box.unread_sender_count + 1
                            ELSE chat.box.unread_sender_count
                        END
                    `,
                        senderMessageCount: sql`
                        CASE
                            WHEN chat.box.sender_id = ${createdBy}
                            THEN chat.box.sender_message_count + 1
                            ELSE chat.box.sender_message_count
                        END
                    `,
                        receiverMessageCount: sql`
                        CASE
                            WHEN chat.box.receiver_id = ${createdBy}
                            THEN chat.box.receiver_message_count + 1
                            ELSE chat.box.receiver_message_count
                        END
                    `,
                    }))
            )
            .returning(['id', 'senderId', 'receiverId'])
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

        return {
            boxId: box.id,
            senderId: box.senderId,
            receiverId: box.receiverId,
            body: message.body,
            createdAt: utils.time.getNow().toDate(),
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
