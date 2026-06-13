import z from 'zod'

export const DeviceIdParam = z.object({})

export type DeviceIdParam = z.infer<typeof DeviceIdParam>
