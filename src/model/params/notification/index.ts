import z from 'zod'
import { AuthNotificationId } from '../../../database/auth/notification/type.js'

export const NotificationIdParam = z.object({
    id: AuthNotificationId,
})

export type NotificationIdParam = z.infer<typeof NotificationIdParam>
