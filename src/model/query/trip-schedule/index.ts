import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'
import z from 'zod'
import { DateInput, OrderBy } from '../../common.js'

export const TripScheduleFilter = z.object({
    limit: z.coerce.number().min(10).max(100).optional().default(10),
    next: OperationTripScheduleId.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    date: DateInput.optional(),
    orderBy: OrderBy,
})

export type TripScheduleFilter = z.infer<typeof TripScheduleFilter>
