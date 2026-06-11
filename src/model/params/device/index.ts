import z from 'zod'
import { AuthUserDevicePublicId } from '../../../database/auth/user_device/type.js'

export const DeviceIdParam = z.object({
    id: AuthUserDevicePublicId,
})

export type DeviceIdParam = z.infer<typeof DeviceIdParam>
