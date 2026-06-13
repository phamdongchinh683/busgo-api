import { sql } from 'kysely'
import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../../auth/user/type.js'
import { ChatBoxQuery } from '../../../model/query/chat/index.js'

export async function findAllByUserId(q: ChatBoxQuery, userId: AuthUserId) {
    const { limit, next } = q
    let qb = db
        .selectFrom('chat.box as b')
        .innerJoin('auth.user as peer', join =>
            join.on(eb =>
                eb.or([
                    eb.and([
                        eb('b.senderId', '=', userId),
                        eb('peer.id', '=', eb.ref('b.receiverId')),
                    ]),
                    eb.and([
                        eb('b.receiverId', '=', userId),
                        eb('peer.id', '=', eb.ref('b.senderId')),
                    ]),
                ])
            )
        )
        .leftJoin('auth.user as sender', 'sender.id', 'b.senderId')
        .leftJoin('auth.user as receiver', 'receiver.id', 'b.receiverId')
        .leftJoin('auth.user as lastSender', 'lastSender.id', 'b.lastMessageSenderId')

    if (next) {
        qb = qb.where('b.id', '>', next)
    }

    return qb
        .select([
            'b.id',
            'b.id',
            'b.lastMessage',
            'sender.id as senderId',
            'receiver.id as receiverId',
            sql<string>`peer.first_name || ' ' || peer.last_name`.as('displayName'),
            'b.senderMessageCount',
            'b.receiverMessageCount',
            'b.unreadReceiverCount',
            'b.unreadSenderCount',
            'lastSender.id as lastMessageSenderId',
        ])
        .orderBy('b.unreadReceiverCount', 'desc')
        .limit(limit + 1)
        .execute()
}
