import { db } from '../../../datasource/db.js'
import { ChatBoxId } from './type.js'

export async function findById(id: ChatBoxId) {
    return db.selectFrom('chat.box').selectAll().where('id', '=', id).executeTakeFirst()
}

export async function findAll(params: { limit: number; next?: ChatBoxId }) {
    return db
        .selectFrom('chat.box as b')
        .where(eb => {
            const cond = []
            if (params.next) cond.push(eb('b.id', '>', params.next))
            return eb.and(cond)
        })
        .selectAll()
        .orderBy('b.id', 'asc')
        .limit(params.limit + 1)
        .execute()
}
