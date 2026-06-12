import z from 'zod'
import { OrganizationBusCompanyReviewId } from '../../../database/organization/bus_company_review/type.js'
import {
    OrganizationBusCompanyId,
    OrganizationBusCompanyPublicId,
} from '../../../database/organization/bus_company/type.js'

export const BusCompanyReviewFilter = z.object({
    companyId: OrganizationBusCompanyId,
    limit: z.coerce.number().int().min(1).max(100).default(10),
    star: z.coerce.number().int().min(1).max(5).optional(),
    next: OrganizationBusCompanyReviewId.optional().nullable(),
})

export type BusCompanyReviewFilter = z.infer<typeof BusCompanyReviewFilter>

export const BusCompanyReviewRequestFilter = BusCompanyReviewFilter.extend({
    companyId: OrganizationBusCompanyPublicId,
})

export type BusCompanyReviewRequestFilter = z.infer<typeof BusCompanyReviewRequestFilter>
