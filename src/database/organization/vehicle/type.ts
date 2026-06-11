import { z } from 'zod'

export const OrganizationVehicleId = z.coerce.number().brand<'organization.vehicle.id'>()
export type OrganizationVehicleId = z.infer<typeof OrganizationVehicleId>

export const OrganizationVehiclePublicId = z.uuid().brand<'organization.vehicle.public_id'>()
export type OrganizationVehiclePublicId = z.infer<typeof OrganizationVehiclePublicId>

export const OrganizationVehicleType = z.enum(['seat', 'bed'])
export type OrganizationVehicleType = z.infer<typeof OrganizationVehicleType>

export const OrganizationVehicleStatus = z.enum(['active', 'maintenance', 'inactive'])
export type OrganizationVehicleStatus = z.infer<typeof OrganizationVehicleStatus>
