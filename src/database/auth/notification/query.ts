import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../user/type.js'
import { AuthNotificationId } from './type.js'

export async function findAllByUserId(query: {
    limit: number
    next?: AuthNotificationId
    userId: AuthUserId
}) {
    const { limit, next, userId } = query
    return db
        .selectFrom('auth.notification')
        .selectAll()
        .where('userId', '=', userId)
        .where(eb => {
            const cond = []
            if (next) {
                cond.push(eb('id', '>', next))
            }
            return eb.and(cond)
        })
        .orderBy('createdAt', 'desc')
        .limit(limit + 1)
        .execute()
}
