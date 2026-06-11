import { OrganizationVehiclePublicId } from '../../../database/organization/vehicle/type.js'
import z from 'zod'

export const VehicleIdParam = z.object({
    id: OrganizationVehiclePublicId,
})
export type VehicleIdParam = z.infer<typeof VehicleIdParam>
