import { db } from '../../../datasource/db.js'
import { ChatMessageQuery } from '../../../model/query/chat/index.js'
import type { ChatBoxId } from '../box/type.js'

export async function findAllMessagesByBoxId(
    params: {
        boxId: ChatBoxId,
    },
    query: ChatMessageQuery
) {
    const { limit, next, message } = query
    const { boxId } = params

    return db
        .selectFrom('chat.message as m')
        .innerJoin('auth.user as u', 'u.id', 'm.senderId')
        .where(eb => {
            const cond = []
            cond.push(eb('m.boxId', '=', boxId))
            if (next) cond.push(eb('m.id', '>', next))
            if (message) cond.push(eb('m.body', '=', message))
            return eb.and(cond)
        })
        .select([
            'm.id',
            'm.senderId',
            'm.body as message',
            'u.fullName as fullName',
            'u.phone as phone',
            'u.email as email',
            'm.createdAt',
        ])
        .orderBy('m.id', 'asc')
        .limit(limit + 1)
        .execute()
}
