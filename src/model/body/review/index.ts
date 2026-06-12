import z from 'zod'
import {
    OrganizationBusCompanyReviewId,
    OrganizationBusCompanyReviewPublicId,
} from '../../../database/organization/bus_company_review/type.js'
import { OperationTripId, OperationTripPublicId } from '../../../database/operation/trip/type.js'
import { BookingTicketId, BookingTicketPublicId } from '../../../database/booking/ticket/type.js'

export const BusCompanyReviewBody = z.object({
    tripId: OperationTripId,
    ticketId: BookingTicketId,
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(1000).optional().nullable(),
})

export type BusCompanyReviewBody = z.infer<typeof BusCompanyReviewBody>

export const BusCompanyReviewRequestBody = BusCompanyReviewBody.extend({
    tripId: OperationTripPublicId,
    ticketId: BookingTicketPublicId,
})

export type BusCompanyReviewRequestBody = z.infer<typeof BusCompanyReviewRequestBody>

export const BusCompanyReviewItemResponse = z.object({
    id: OrganizationBusCompanyReviewPublicId,
    reviewerName: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().nullable(),
})

export type BusCompanyReviewItemResponse = z.infer<typeof BusCompanyReviewItemResponse>

export const BusCompanyReviewListResponse = z.object({
    comments: z.array(BusCompanyReviewItemResponse),
    next: OrganizationBusCompanyReviewId.nullable(),
})

export type BusCompanyReviewListResponse = z.infer<typeof BusCompanyReviewListResponse>

export const BusCompanyTotalStarsResponse = z.object({
    avgStars: z.number().min(0).max(5),
    reviewCount: z.number().int().nonnegative(),
})

export type BusCompanyTotalStarsResponse = z.infer<typeof BusCompanyTotalStarsResponse>
