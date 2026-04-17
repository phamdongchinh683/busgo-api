import z from 'zod'
import { AuthNotificationId } from '../../../database/auth/notification/type.js'
import { AuthUserId } from '../../../database/auth/user/type.js'

export const NotificationBody = z.object({
    userId: AuthUserId,
    title: z.string().min(1).max(255),
    body: z.string().min(1).max(2000),
    data: z.string().nullable().optional(),
})

export type NotificationBody = z.infer<typeof NotificationBody>

export const NotificationResponse = z.object({
    id: AuthNotificationId,
    userId: AuthUserId,
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
