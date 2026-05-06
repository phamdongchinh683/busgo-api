import { z } from 'zod'

export const GetCompanyReviewsQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
})
export type GetCompanyReviewsQuery = z.infer<typeof GetCompanyReviewsQuery>
