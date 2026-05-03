import { sql } from 'kysely'
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
    let qb = db
        .selectFrom('chat.box as b')
        .where(
            sql<boolean>`(',' || b.user_ids || ',') like ${`%,${userId},%`}`,
        )

    if (next) {
        qb = qb.where('b.id', '>', next)
    }

    return qb
        .select(['b.id', 'b.title', 'b.lastMessage'])
        .orderBy('b.id', 'asc')
        .limit(limit + 1)
        .execute()
}