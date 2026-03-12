import { PeriodFilter } from '../../common.js'
import z from 'zod'
import { BookingStatus } from '../../../database/booking/booking/type.js'

export const PeriodBookingQuery = PeriodFilter.extend({
    status: BookingStatus.optional(),
})

export type PeriodBookingQuery = z.infer<typeof PeriodBookingQuery>
