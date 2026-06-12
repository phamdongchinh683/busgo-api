import z from 'zod'
import {
    AuthNotificationId,
    AuthNotificationPublicId,
} from '../../../database/auth/notification/type.js'
import { AuthUserPublicId } from '../../../database/auth/user/type.js'

export const NotificationResponse = z.object({
    id: AuthNotificationPublicId,
    userId: AuthUserPublicId,
    title: z.string(),
    body: z.string(),
    isRead: z.boolean(),
    data: z.string().nullable(),
})

export type NotificationResponse = z.infer<typeof NotificationResponse>

export const NotificationsResponse = z.object({
    notifications: z.array(NotificationResponse),
    next: AuthNotificationId.nullable(),
})

export type NotificationsResponse = z.infer<typeof NotificationsResponse>
