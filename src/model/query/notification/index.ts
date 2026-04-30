import { AuthNotificationId } from '../../../database/auth/notification/type.js'
import z from 'zod'

export const NotificationQuery = z.object({
    limit: z.coerce.number().min(10).max(100).optional(),
    status: z.coerce.number().optional(),
    next: AuthNotificationId.optional(),
})

export type NotificationQuery = z.infer<typeof NotificationQuery>
