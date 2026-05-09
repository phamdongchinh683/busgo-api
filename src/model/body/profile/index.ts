import z from 'zod'
import { AuthUserId, AuthUserStatus } from '../../../database/auth/user/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import {
    AuthStaffProfileId,
    AuthStaffProfileRole,
} from '../../../database/auth/staff_profile/type.js'
import { Email, Otp, Phone, UserInfo } from '../../common.js'

export const ProfileUpdateBody = z.object({
    fullName: z.string().optional(),
    status: AuthUserStatus.optional(),
    companyId: OrganizationBusCompanyId.nullable().optional(),
    staffCode: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    identityNumber: z.string().nullable().optional(),
    hireDate: z.coerce.date().nullable().optional(),
})

export type ProfileUpdateBody = z.infer<typeof ProfileUpdateBody>

export const ProfileUpdateContactBody = z.discriminatedUnion('field', [
    z.object({
        field: z.literal('email'),
        value: Email,
        otp: Otp,
    }),
    z.object({
        field: z.literal('phone'),
        value: Phone,
        otp: Otp,
    }),
])

export type ProfileUpdateContactBody = z.infer<typeof ProfileUpdateContactBody>

export const ProfileUpdateContactResponse = z.object({
    message: z.string(),
    token: z.string(),
    user: UserInfo,
})
export type ProfileUpdateContactResponse = z.infer<typeof ProfileUpdateContactResponse>

export const ProfileResponse = z
    .object({
        user: ProfileUpdateBody.extend({
            accountStripeId: z.string().nullable(),
        }).nullable(),
    })
    .optional()

export type ProfileResponse = z.infer<typeof ProfileResponse>

export const ProfileResponseUser = z.object({
    user: ProfileUpdateBody,
})

export type ProfileResponseUser = z.infer<typeof ProfileResponseUser>

export const StaffRoleResponse = z.object({
    user: ProfileUpdateBody,
})

export type StaffRoleResponse = z.infer<typeof StaffRoleResponse>

export const StaffListResponse = z.object({
    staff: z.array(
        ProfileUpdateBody.extend({
            id: AuthStaffProfileId,
            fullName: z.string(),
            email: Email,
            phone: Phone,
            userId: AuthUserId,
            role: AuthStaffProfileRole,
            status: AuthUserStatus,
        })
    ),
    next: AuthStaffProfileId.nullable(),
})

export type StaffListResponse = z.infer<typeof StaffListResponse>

export const ProfileAccountResponse = z.object({
    user: z.object({
        fullName: z.string(),
        email: Email,
        phone: Phone,
        status: AuthUserStatus,
        accountStripeId: z.string().nullable(),
    }),
})

export type ProfileAccountResponse = z.infer<typeof ProfileAccountResponse>
