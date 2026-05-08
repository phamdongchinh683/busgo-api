import z from 'zod'
import { OrganizationBusCompanyReviewId } from '../../../database/organization/bus_company_review/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const BusCompanyReviewFilter = z.object({
    companyId: OrganizationBusCompanyId,
    limit: z.coerce.number().int().min(1).max(100).default(10),
    star: z.coerce.number().int().min(1).max(5).optional(),
    next: OrganizationBusCompanyReviewId.optional().nullable(),
})

export type BusCompanyReviewFilter = z.infer<typeof BusCompanyReviewFilter>
