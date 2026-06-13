import { z } from 'zod'

export const OperationTripScheduleId = z.coerce.number().brand<'operation.trip_schedule.id'>()
export type OperationTripScheduleId = z.infer<typeof OperationTripScheduleId>
