import { dal } from '../../database/index.js'
import { BookingRequest } from '../../model/body/booking/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { BookingType } from '../../database/booking/booking/type.js'
import { PeriodFilter } from '../../model/common.js'
import { PeriodBookingQuery } from '../../model/query/booking/index.js'

export async function initBooking(params: BookingRequest, userId: AuthUserId) {
    const { type, returnBound } = params
    if (type === BookingType.enum.one_way) {
        return await dal.booking.booking.cmd.createOneWayBooking(params, userId)
    } else if (type === BookingType.enum.round_trip && returnBound) {
        return await dal.booking.booking.cmd.createRoundTripBooking(params, userId)
    }
}

export async function getPeriodBookings(params: PeriodBookingQuery) {
    const data = await dal.booking.booking.query.getPeriod(params)
    return { data: data }
}