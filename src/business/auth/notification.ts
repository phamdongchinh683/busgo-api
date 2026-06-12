import { AuthNotificationId } from '../../database/auth/notification/type.js'
import { AuthUserId, AuthUserPublicId } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { NotificationQuery } from '../../model/query/notification/index.js'
import { service } from '../../service/index.js'
import { utils } from '../../utils/index.js'

export async function createNotification(params: {
    userId: AuthUserId
    title: string
    body: string
    data?: string | null
}) {
    await dal.auth.notification.cmd.insertOne({
        userId: params.userId,
        title: params.title,
        body: params.body,
        isRead: false,
        data: params.data ?? null,
    })

    if (process.env.APP_ENV === 'production') {
        const userDevice = await dal.auth.userDevice.query.findAllByUserId(params.userId)

        if (userDevice.length > 0) {
            await service.firebase.fcm.sendFcm({
                fcmTokens: userDevice.map(device => device.fcmToken),
                title: params.title,
                body: params.body,
                data: params.data ? JSON.parse(params.data) : null,
            })
        }

        return { message: 'Thành công' }
    }

    return { message: 'Thành công' }
}

export async function getMyNotifications(query: NotificationQuery, userId: AuthUserId) {
    const notifications = await dal.auth.notification.query.findAllByUserId({
        limit: query.limit ?? 10,
        next: query.next,
        userId: userId,
        ...(query.status !== undefined ? { status: query.status === 1 } : {}),
    })
    const { data, next } = utils.common.paginateByCursor(notifications, query.limit ?? 10)

    return {
        notifications: data,
        next: next,
    }
}

export async function markNotificationAsRead(
    id: AuthNotificationId,
    userId: AuthUserId,
    userPublicId: AuthUserPublicId
) {
    const notification = await dal.auth.notification.cmd.markAsRead(id, userId)
    return {
        ...notification,
        userId: userPublicId,
    }
}
