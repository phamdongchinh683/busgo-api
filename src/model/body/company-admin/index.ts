import z from 'zod'
import { AuthCompanyAdminSignUpBody } from '../auth/index.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { AuthUserId, AuthUserStatus } from '../../../database/auth/user/type.js'
import { Email, Phone } from '../../common.js'

export const CompanyAdminCreateBody = AuthCompanyAdminSignUpBody.extend({
    companyId: OrganizationBusCompanyId,
})
export type CompanyAdminCreateBody = z.infer<typeof CompanyAdminCreateBody>

export const CompanyAdminUpdateBody = z.object({
    role: AuthStaffProfileRole.optional(),
    status: AuthUserStatus.optional(),
})
export type CompanyAdminUpdateBody = z.infer<typeof CompanyAdminUpdateBody>

export const CompanyAdminItemSchema = z.object({
    id: AuthUserId,
    username: z.string(),
    fullName: z.string(),
    email: Email,
    phone: Phone.nullable(),
    status: AuthUserStatus,
    role: AuthStaffProfileRole,
    companyId: OrganizationBusCompanyId.nullable(),
    companyName: z.string().nullable(),
})
export type CompanyAdminItemSchema = z.infer<typeof CompanyAdminItemSchema>

export const CompanyAdminListResponseSchema = z.object({
    admins: z.array(CompanyAdminItemSchema),
    next: AuthUserId.nullable(),
})
export type CompanyAdminListResponseSchema = z.infer<typeof CompanyAdminListResponseSchema>

export const CompanyAdminUpdateResponseSchema = z.object({
    message: z.string(),
})
export type CompanyAdminUpdateResponseSchema = z.infer<typeof CompanyAdminUpdateResponseSchema>
