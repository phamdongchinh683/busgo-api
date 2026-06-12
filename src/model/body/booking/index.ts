import { BookingPublicId, BookingType } from '../../../database/booking/booking/type.js'
import { BookingCouponId, BookingCouponPublicId } from '../../../database/booking/coupon/type.js'
import z from 'zod'
import {
    OrganizationSeatId,
    OrganizationSeatPublicId,
} from '../../../database/organization/seat/type.js'
import {
    OperationStationId,
    OperationStationPublicId,
} from '../../../database/operation/station/type.js'
import { OperationTripId, OperationTripPublicId } from '../../../database/operation/trip/type.js'
import {
    OrganizationBusCompanyId,
    OrganizationBusCompanyPublicId,
} from '../../../database/organization/bus_company/type.js'

export const BookingTicketRequest = z.object({
    tripId: OperationTripId,
    seatId: OrganizationSeatId,
    fromStationId: OperationStationId,
    companyId: OrganizationBusCompanyId,
    toStationId: OperationStationId,
})

export type BookingTicketRequest = z.infer<typeof BookingTicketRequest>

export const BookingTicketRequestBody = BookingTicketRequest.extend({
    tripId: OperationTripPublicId,
    seatId: OrganizationSeatPublicId,
    fromStationId: OperationStationPublicId,
    companyId: OrganizationBusCompanyPublicId,
    toStationId: OperationStationPublicId,
})

export const BookingRequest = z.object({
    couponId: BookingCouponId.optional(),
    type: BookingType,
    outBound: BookingTicketRequest,
    returnBound: BookingTicketRequest.optional(),
})

export type BookingRequest = z.infer<typeof BookingRequest>

export const BookingRequestBody = BookingRequest.extend({
    couponId: BookingCouponPublicId.optional(),
    outBound: BookingTicketRequestBody,
    returnBound: BookingTicketRequestBody.optional(),
})

export type BookingRequestBody = z.infer<typeof BookingRequestBody>

export const BookingResponse = z.object({
    id: BookingPublicId,
    expiredAt: z.date().nullable(),
    message: z.string(),
})

export type BookingResponse = z.infer<typeof BookingResponse>
