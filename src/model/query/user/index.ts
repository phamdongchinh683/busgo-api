import { Email, PeriodFilter, Phone } from '../../common.js'
import { AuthUserId, AuthUserRole, AuthUserStatusQuery } from '../../../database/auth/user/type.js'
import z from 'zod'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const PeriodUserQuery = PeriodFilter.extend({
    status: AuthUserStatusQuery.optional(),
    role: AuthUserRole.optional(),
})

export type PeriodUserQuery = z.infer<typeof PeriodUserQuery>

export const AuthUserQuery = z.object({
    userId: AuthUserId.optional(),
    companyId: OrganizationBusCompanyId.optional(),
    email: Email.optional(),
    phone: Phone.optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    next: AuthUserId.optional(),
})

export type AuthUserQuery = z.infer<typeof AuthUserQuery>
