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

    if (next) {
        qb = qb.where('b.id', '>', next)
    }

    return qb
        .select([
            'b.id as cursorId',
            'b.publicId as id',
            'b.lastMessage',
            'b.senderId',
            'b.receiverId',
            'peer.fullName as displayName',
            'b.senderMessageCount',
            'b.receiverMessageCount',
            'b.unreadReceiverCount',
            'b.unreadSenderCount',
            'b.lastMessageSenderId',
        ])
        .orderBy('b.unreadReceiverCount', 'desc')
        .limit(limit + 1)
        .execute()
}
