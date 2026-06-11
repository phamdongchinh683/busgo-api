import { z } from 'zod'

export const AuthUserDeviceId = z.coerce.number().brand<'auth.user_device.id'>()
export type AuthUserDeviceId = z.infer<typeof AuthUserDeviceId>

export const AuthUserDevicePublicId = z.uuid().brand<'auth.user_device.public_id'>()
export type AuthUserDevicePublicId = z.infer<typeof AuthUserDevicePublicId>
