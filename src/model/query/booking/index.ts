import { PeriodFilter } from '../../common.js'
import z from 'zod'
import { PaymentStatus } from '../../../database/booking/booking/type.js'

export const PeriodBookingQuery = PeriodFilter.extend({
    status: PaymentStatus.optional(),
})

export type PeriodBookingQuery = z.infer<typeof PeriodBookingQuery>
