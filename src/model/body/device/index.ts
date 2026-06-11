import z from 'zod'
import {
    AuthUserDeviceId,
    AuthUserDevicePublicId,
} from '../../../database/auth/user_device/type.js'

export const DeviceBody = z.object({
    fcmToken: z.string(),
})

export type DeviceBody = z.infer<typeof DeviceBody>

export const DeviceResponse = z.object({
    id: AuthUserDevicePublicId,
    fcmToken: z.string(),
})

export type DeviceResponse = z.infer<typeof DeviceResponse>

export const DevicesResponse = z.array(DeviceResponse)

export type DevicesResponse = z.infer<typeof DevicesResponse>

export const SendFcmBody = z.object({
    fcmToken: z.string(),
    title: z.string(),
    body: z.string(),
    data: z.record(z.string(), z.string()).optional(),
})
export type SendFcmBody = z.infer<typeof SendFcmBody>

export const SendFcmResponse = z.object({
    message: z.string(),
})
export type SendFcmResponse = z.infer<typeof SendFcmResponse>
