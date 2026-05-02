import { db } from '../../../datasource/db.js'
import type { ChatBoxId } from '../box/type.js'
import { ChatMessageId } from './type.js'

export async function findAllByBox(
    boxId: ChatBoxId,
    params: { limit: number; next?: ChatMessageId }
) {
    return db
        .selectFrom('chat.message as m')
        .where(eb => {
            const cond = [eb('m.boxId', '=', boxId)]
            if (params.next) cond.push(eb('m.id', '>', params.next))
            return eb.and(cond)
        })
        .selectAll()
        .orderBy('m.id', 'asc')
        .limit(params.limit + 1)
        .execute()
}
