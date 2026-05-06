import { z } from 'zod'
export const OrganizationCompanyReviewId = z.string().uuid().brand<'organization.company_review.id'>()
export type OrganizationCompanyReviewId = z.infer<typeof OrganizationCompanyReviewId>
export const OrganizationCompanyReviewStatus = z.enum(['published', 'hidden'])
export type OrganizationCompanyReviewStatus = z.infer<typeof OrganizationCompanyReviewStatus>