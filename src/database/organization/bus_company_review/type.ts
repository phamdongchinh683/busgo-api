import { z } from 'zod'

export const OrganizationBusCompanyReviewId = z.coerce
    .number()
    .brand<'organization.bus_company_review.id'>()
export type OrganizationBusCompanyReviewId = z.infer<typeof OrganizationBusCompanyReviewId>
