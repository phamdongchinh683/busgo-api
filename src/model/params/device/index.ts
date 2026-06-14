import z from 'zod'
import { AuthUserDeviceId } from '../../../database/auth/user_device/type.js'

export const DeviceIdParam = z.object({
    id: AuthUserDeviceId,
})

export type DeviceIdParam = z.infer<typeof DeviceIdParam>
