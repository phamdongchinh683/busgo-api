import { z } from 'zod'

export const AuthNotificationId = z.coerce.number().brand<'auth.notification.id'>()
export type AuthNotificationId = z.infer<typeof AuthNotificationId>

export const AuthNotificationPublicId = z.uuid().brand<'auth.notification.public_id'>()
export type AuthNotificationPublicId = z.infer<typeof AuthNotificationPublicId>
