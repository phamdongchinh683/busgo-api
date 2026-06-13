import { AuthNotificationId } from '../../database/auth/notification/type.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { NotificationQuery } from '../../model/query/notification/index.js'
import { utils } from '../../utils/index.js'

export async function getMyNotifications(query: NotificationQuery, userId: AuthUserId) {
    const notifications = await dal.auth.notification.query.findAllByUserId({
        limit: query.limit ?? 10,
        next: query.next,
        userId: userId,
        status: query.status,
    })
    const { data, next } = utils.common.paginateByCursor(notifications, query.limit ?? 10)

    return {
        notifications: data,
        next: next,
    }
}

export async function markNotificationAsRead(id: AuthNotificationId, userId: AuthUserId) {
    return dal.auth.notification.cmd.markAsRead(id, userId)
}
