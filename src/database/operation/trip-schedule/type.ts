import { z } from 'zod'

export const OperationTripScheduleId = z.coerce.number().brand<'operation.trip_schedule.id'>()
export type OperationTripScheduleId = z.infer<typeof OperationTripScheduleId>

export const VehicleServiceType = z.enum(['regular', 'limousine', 'sleeper', 'vip'])
export type VehicleServiceType = z.infer<typeof VehicleServiceType>
