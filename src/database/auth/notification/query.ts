import { db } from '../../../datasource/db.js'
import { AuthUserId } from '../user/type.js'
import { AuthNotificationId } from './type.js'
import { StatusFlag } from '../../../model/common.js'

export async function findAllByUserId(query: {
    limit: number
    next?: AuthNotificationId
    userId: AuthUserId
    status?: StatusFlag
}) {
    const { limit, next, userId, status } = query
    return db
        .selectFrom('auth.notification as n')
        .innerJoin('auth.user as u', 'u.id', 'n.userId')
        .selectAll('n')
        .select(['n.id as cursorId', 'n.publicId as id', 'u.publicId as userId'])
        .where(eb => {
            const cond = []
            if (next) {
                cond.push(eb('n.id', '>', next))
            }
            if (status !== undefined) {
                cond.push(eb('n.isRead', '=', status === 1))
            }
            cond.push(eb('n.userId', '=', userId))
            return eb.and(cond)
        })
        .orderBy('n.createdAt', 'desc')
        .limit(limit + 1)
        .execute()
}
