import { z } from 'zod'

export const OrganizationBusCompanyReviewId = z.coerce
    .number()
    .brand<'organization.bus_company_review.id'>()
export type OrganizationBusCompanyReviewId = z.infer<typeof OrganizationBusCompanyReviewId>

export const OrganizationBusCompanyReviewPublicId = z
    .uuid()
    .brand<'organization.bus_company_review.public_id'>()
export type OrganizationBusCompanyReviewPublicId = z.infer<
    typeof OrganizationBusCompanyReviewPublicId
>
