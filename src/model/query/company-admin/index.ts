import z from 'zod'
import { AuthUserId } from '../../../database/auth/user/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const CompanyAdminQuery = z.object({
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    companyId: OrganizationBusCompanyId.optional(),
    next: AuthUserId.nullable().optional(),
})

export type CompanyAdminQuery = z.infer<typeof CompanyAdminQuery>
