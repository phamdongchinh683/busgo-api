import z from 'zod'

export const VehicleIdParam = z.object({})
export type VehicleIdParam = z.infer<typeof VehicleIdParam>
