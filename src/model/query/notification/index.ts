import { AuthNotificationId } from '../../../database/auth/notification/type.js'
import z from 'zod'
import { StatusFlag } from '../../common.js'

export const NotificationQuery = z.object({
    limit: z.coerce.number().min(10).max(100).optional(),
    status: StatusFlag.optional(),
    next: AuthNotificationId.optional(),
})

export type NotificationQuery = z.infer<typeof NotificationQuery>
