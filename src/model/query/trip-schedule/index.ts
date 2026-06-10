import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'
import z from 'zod'
import { OrderBy } from '../../common.js'

export const TripScheduleFilter = z.object({
    limit: z.coerce.number().min(10).max(100).optional().default(10),
    next: OperationTripScheduleId.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.preprocess(val => {
        if (val === true || val === 'true' || val === 1 || val === '1') return true
        if (val === false || val === 'false' || val === 0 || val === '0') return false
        return undefined
    }, z.boolean().optional()),
    date: z.coerce.date().optional(),
    orderBy: OrderBy,
})

export type TripScheduleFilter = z.infer<typeof TripScheduleFilter>
