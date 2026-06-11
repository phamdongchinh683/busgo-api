import z from 'zod'
import { AuthNotificationPublicId } from '../../../database/auth/notification/type.js'

export const NotificationIdParam = z.object({
    id: AuthNotificationPublicId,
})

export type NotificationIdParam = z.infer<typeof NotificationIdParam>
