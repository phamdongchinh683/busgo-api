import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../../auth/user/type.js';
import { ChatBoxId } from './type.js'
import { ChatBoxQuery } from '../../../model/query/chat/index.js';

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

export async function findAllByUserId(q: ChatBoxQuery, userId: AuthUserId) {
    const { limit, next } = q
    return db
        .selectFrom('chat.box as b')
        .where(eb => {
            const cond = []
            if(next) cond.push(eb('b.id', '>', next))
            cond.push(eb('b.userIds', 'like', `%,${userId}%`))
            return eb.and(cond)
        })
        .select([
            'b.id',
            'b.title',
        ])
        .orderBy('b.id', 'asc')
        .limit(limit + 1)
        .execute()
}