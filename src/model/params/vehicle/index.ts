import z from 'zod'
import { OrganizationVehicleId } from '../../../database/organization/vehicle/type.js'

export const VehicleIdParam = z.object({
    id: OrganizationVehicleId,
})
export type VehicleIdParam = z.infer<typeof VehicleIdParam>
