import z from 'zod'
import { AuthUserId, AuthUserRole, AuthUserStatus } from '../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../database/auth/staff_profile/type.js'
import { OrganizationBusCompanyId } from '../database/organization/bus_company/type.js'

export const Email = z.email()
export type Email = z.infer<typeof Email>

export const Phone = z.string().min(10)
export type Phone = z.infer<typeof Phone>

export const ContactInfo = z.object({
    email: Email,
    phone: Phone,
})
export type ContactInfo = z.infer<typeof ContactInfo>

export const UserInfo = z.object({
    id: AuthUserId,
    fullName: z.string(),
    email: Email,
    phone: Phone,
    role: AuthUserRole,
    staffProfileRole: AuthStaffProfileRole.nullable().optional(),
    companyId: OrganizationBusCompanyId.nullable().optional(),
    status: AuthUserStatus,
})

export type UserInfo = z.infer<typeof UserInfo>

export const OrderBy = z.enum(['asc', 'desc'])
export type OrderBy = z.infer<typeof OrderBy>

export const MessageResponse = z.object({
    message: z.string(),
})
export type MessageResponse = z.infer<typeof MessageResponse>

export const PeriodFilter = z.object({
    type: z.enum(['monthly', 'yearly']),
    year: z.coerce.number().optional(),
    month: z.coerce.number().optional(),
})
export type PeriodFilter = z.infer<typeof PeriodFilter>

export const PeriodResponse = z.object({
    data: z.array(z.array(z.number())),
})
export type PeriodResponse = z.infer<typeof PeriodResponse>
