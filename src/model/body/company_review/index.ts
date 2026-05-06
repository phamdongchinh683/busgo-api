import { z } from 'zod'
import { BookingTicketId } from '../../../database/booking/ticket/type.js'

export const CreateCompanyReviewBody = z.object({
    ticketId: BookingTicketId,
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
})
export type CreateCompanyReviewBody = z.infer<typeof CreateCompanyReviewBody>

export const ReplyCompanyReviewBody = z.object({
    reply: z.string().min(1).max(2000),
})
export type ReplyCompanyReviewBody = z.infer<typeof ReplyCompanyReviewBody>
