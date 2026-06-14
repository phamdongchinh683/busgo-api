import { db } from '../../../datasource/db.js'
import { ChatMessageQuery } from '../../../model/query/chat/index.js'
import { AuthUserId } from '../../auth/user/type.js'
import type { ChatBoxId } from '../box/type.js'

export async function findAllMessagesByBoxId(
    params: {
        boxId: ChatBoxId
        userId: AuthUserId
    },
    query: ChatMessageQuery
) {
    const { limit, next, message } = query
    const { boxId } = params

    return db
        .selectFrom('chat.message as m')
        .innerJoin('chat.box as b', 'b.id', 'm.boxId')
        .innerJoin('auth.user as u', 'u.id', 'm.senderId')
        .where(eb => {
            const cond = []
            cond.push(eb('m.boxId', '=', boxId))
            cond.push(
                eb.or([
                    eb('b.senderId', '=', params.userId),
                    eb('b.receiverId', '=', params.userId),
                ])
            )
            // Cursor paging phải khớp thứ tự sort: mới nhất trước → trang sau dùng id nhỏ hơn tin cuối cùng của trang trước
            if (next) cond.push(eb('m.id', '<', next))
            if (message) cond.push(eb('m.body', '=', message))
            return eb.and(cond)
        })
        .select([
            'm.id',
            'm.id',
            'u.id as senderId',
            'm.body as message',
            'u.firstName',
            'u.lastName',
            'u.phone as phone',
            'u.email as email',
            'm.createdAt',
        ])
        .orderBy('m.id', 'desc')
        .limit(limit + 1)
        .execute()
}
