import { OperationTripId } from '../../../database/operation/trip/type.js'
import z from 'zod'
import { OrganizationVehicleId } from '../../../database/organization/vehicle/type.js'

export const SeatBody = z.object({
    id: OperationTripId,
    date: z.coerce.date(),
})

export type SeatBody = z.infer<typeof SeatBody>

export const SeatCreateBody = z.object({
    vehicleId: OrganizationVehicleId,
    floors: z.number().min(1).max(3).default(2),
    rowsPerFloor: z.number().min(1).max(10).default(6),
})

export type SeatCreateBody = z.infer<typeof SeatCreateBody>

export const SeatCreateRequestBody = SeatCreateBody.omit({ vehicleId: true })

export type SeatCreateRequestBody = z.infer<typeof SeatCreateRequestBody>
