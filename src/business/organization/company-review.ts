import { AuthUserId } from '../../database/auth/user/type.js'
import { db } from '../../datasource/db.js'
import {
    CreateCompanyReviewBody,
    ReplyCompanyReviewBody,
} from '../../model/body/company_review/index.js'
import { GetCompanyReviewsQuery } from '../../model/query/company_review/index.js'
import { dal } from '../../database/index.js'
import { NotFound, Forbidden, BadRequest } from '../../app/error-type.js'
import { BookingTicketStatus } from '../../database/booking/ticket/type.js'
import { OrganizationBusCompanyId } from '../../database/organization/bus_company/type.js'
import { OrganizationCompanyReviewId } from '../../database/organization/company_review/type.js'

export async function createReview(userId: AuthUserId, body: CreateCompanyReviewBody) {
    const { ticketId, rating, comment } = body

    const ticket = await db
        .selectFrom('booking.ticket as t')
        .innerJoin('booking.booking as b', 'b.id', 't.bookingId')
        .innerJoin('operation.trip as trip', 'trip.id', 't.tripId')
        .innerJoin('operation.trip_schedule as tsp', 'tsp.id', 'trip.scheduleId')
        .where('t.id', '=', ticketId)
        .select([
            'b.userId', 
            't.status', 
            'tsp.companyId'
        ])
        .executeTakeFirst()

    if (!ticket) {
        throw new NotFound('Ticket not found')
    }

    if (ticket.userId !== userId) {
        throw new Forbidden('You can only review your own tickets')
    }

    if (ticket.status !== BookingTicketStatus.enum.checked_in) {
        throw new BadRequest('You can only review completed trips')
    }

    const existingReview = await dal.organization.companyReview.query.findReviewByTicketId(ticketId)
    if (existingReview) {
        throw new BadRequest('You have already reviewed this ticket')
    }
    await db.transaction().execute(async trx => {
        await dal.organization.companyReview.cmd.insertReview(
            {
                companyId: ticket.companyId,
                userId: userId,
                ticketId: ticketId,
                rating: rating,
                comment: comment,
                status: 'published',
            },
            trx
        )

        await dal.organization.companyReview.cmd.updateCompanyRatingCache(ticket.companyId, trx)
    })

    return { message: 'Review submitted successfully' }
}

export async function getCompanyReviews(companyId: OrganizationBusCompanyId, query: GetCompanyReviewsQuery) {
    return dal.organization.companyReview.query.getReviewsByCompanyId(
        companyId,
        query.page,
        query.limit
    )
}

export async function replyToReview(
    reviewId: OrganizationCompanyReviewId,
    body: ReplyCompanyReviewBody
) {
    const { reply } = body
    await dal.organization.companyReview.cmd.replyToReview(reviewId, reply)
    return { message: 'Reply sent successfully' }
}
