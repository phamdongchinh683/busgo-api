import { AuthUserId } from '../../../database/auth/user/type.js'
import { BookingId, BookingType } from '../../../database/booking/booking/type.js'
import { BookingCouponId } from '../../../database/booking/coupon/type.js'
import z from 'zod'
import { OrganizationSeatId } from '../../../database/organization/seat/type.js'
import { OperationStationId } from '../../../database/operation/station/type.js'
import { OperationTripId } from '../../../database/operation/trip/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const BookingTicketRequest = z.object({
    tripId: OperationTripId,
    seatId: OrganizationSeatId,
    fromStationId: OperationStationId,
    companyId: OrganizationBusCompanyId,
    toStationId: OperationStationId,
})

export type BookingTicketRequest = z.infer<typeof BookingTicketRequest>

export const BookingRequest = z.object({
    couponId: BookingCouponId.optional(),
    type: BookingType,
    outBound: BookingTicketRequest,
    returnBound: BookingTicketRequest.optional(),
})

export type BookingRequest = z.infer<typeof BookingRequest>

export const BookingResponse = z.object({
    id: BookingId,
    expiredAt: z.date().nullable(),
    message: z.string(),
})

export type BookingResponse = z.infer<typeof BookingResponse>
