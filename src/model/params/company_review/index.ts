import { z } from 'zod'
import { OrganizationCompanyReviewId } from '../../../database/organization/company_review/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const ReviewIdParam = z.object({
    reviewId: OrganizationCompanyReviewId,
})
export type ReviewIdParam = z.infer<typeof ReviewIdParam>

export const CompanyIdParam = z.object({
    companyId: OrganizationBusCompanyId,
})
export type CompanyIdParam = z.infer<typeof CompanyIdParam>
