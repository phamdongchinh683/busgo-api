import {
    OrganizationVehicleId,
    OrganizationVehiclePublicId,
    OrganizationVehicleStatus,
    OrganizationVehicleType,
} from '../../../database/organization/vehicle/type.js'
import z from 'zod'
import { PublicApiId } from '../../public-id.js'

export const VehicleBody = z.object({
    plateNumber: z.string(),
    type: OrganizationVehicleType,
    companyId: z.number(),
    totalSeats: z.number(),
    status: OrganizationVehicleStatus,
})

export type VehicleBody = z.infer<typeof VehicleBody>

export const VehicleResponse = z.object({
    vehicle: VehicleBody.extend({
        id: PublicApiId(OrganizationVehiclePublicId, OrganizationVehicleId),
    }),
})

export type VehicleResponse = z.infer<typeof VehicleResponse>

export const VehicleListResponse = z.object({
    vehicles: z.array(
        VehicleBody.extend({
            id: PublicApiId(OrganizationVehiclePublicId, OrganizationVehicleId),
        })
    ),
    next: OrganizationVehicleId.nullable(),
})

export type VehicleListResponse = z.infer<typeof VehicleListResponse>
