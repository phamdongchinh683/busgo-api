import { z } from 'zod'

export const AuthNotificationId = z.coerce.number().brand<'auth.notification.id'>()
export type AuthNotificationId = z.infer<typeof AuthNotificationId>
