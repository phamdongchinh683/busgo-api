import { OperationTripId } from '../../../database/operation/trip/type.js'
import z from 'zod'
import { OrganizationVehicleId } from '../../../database/organization/vehicle/type.js'

export const SeatBody = z.object({
    id: OperationTripId,
    date: z.coerce.date(),
})

export type SeatBody = z.infer<typeof SeatBody>

export const SeatCount = z.enum(['24', '36'])

export type SeatCount = z.infer<typeof SeatCount>

export const SeatCreateBody = z.object({
    vehicleId: OrganizationVehicleId,
    seatCount: SeatCount,
})

export type SeatCreateBody = z.infer<typeof SeatCreateBody>

export const SeatCreateRequestBody = SeatCreateBody.extend({})

export type SeatCreateRequestBody = z.infer<typeof SeatCreateRequestBody>
