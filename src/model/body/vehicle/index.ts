import {
    OrganizationVehicleId,
    OrganizationVehicleStatus,
    OrganizationVehicleType,
} from '../../../database/organization/vehicle/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import z from 'zod'

export const VehicleBody = z.object({
    plateNumber: z.string(),
    type: OrganizationVehicleType,
    companyId: OrganizationBusCompanyId,
    totalSeats: z.number(),
    status: OrganizationVehicleStatus,
})

export type VehicleBody = z.infer<typeof VehicleBody>

export const VehicleResponse = z.object({
    vehicle: VehicleBody.omit({ companyId: true }).extend({
        id: OrganizationVehicleId,
    }),
})

export type VehicleResponse = z.infer<typeof VehicleResponse>

export const VehicleListResponse = z.object({
    vehicles: z.array(
        VehicleBody.omit({ companyId: true }).extend({
            id: OrganizationVehicleId,
        })
    ),
    next: OrganizationVehicleId.nullable(),
})

export type VehicleListResponse = z.infer<typeof VehicleListResponse>
