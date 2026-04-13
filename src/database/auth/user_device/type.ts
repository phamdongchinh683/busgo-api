import { z } from 'zod'

export const AuthUserDeviceId = z.coerce.number().brand<'auth.user_device.id'>()
export type AuthUserDeviceId = z.infer<typeof AuthUserDeviceId>
