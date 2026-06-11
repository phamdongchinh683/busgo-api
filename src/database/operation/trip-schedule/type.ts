import { z } from 'zod'

export const OperationTripScheduleId = z.coerce.number().brand<'operation.trip_schedule.id'>()
export type OperationTripScheduleId = z.infer<typeof OperationTripScheduleId>

export const OperationTripSchedulePublicId = z.uuid().brand<'operation.trip_schedule.public_id'>()
export type OperationTripSchedulePublicId = z.infer<typeof OperationTripSchedulePublicId>
