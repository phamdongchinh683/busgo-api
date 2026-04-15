import z from 'zod'
import { AuthUserId, AuthUserStatus } from '../../../database/auth/user/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { AuthStaffProfileId } from '../../../database/auth/staff_profile/type.js'

export const ProfileUpdateBody = z.object({
    fullName: z.string().optional(),
    status: AuthUserStatus.optional(),
    companyId: OrganizationBusCompanyId.nullable().optional(),
    staffCode: z.string().nullable().optional(),
    position: z.string().nullable().optional(),
    department: z.string().nullable().optional(),
    identityNumber: z.string().min(12).nullable().optional(),
    hireDate: z.coerce.date().nullable().optional(),
})

export type ProfileUpdateBody = z.infer<typeof ProfileUpdateBody>

export const ProfileResponse = z
    .object({
        user: ProfileUpdateBody.nullable(),
    })
    .optional()

export type ProfileResponse = z.infer<typeof ProfileResponse>

export const StaffRoleResponse = z.object({
    user: ProfileUpdateBody,
})

export type StaffRoleResponse = z.infer<typeof StaffRoleResponse>

export const StaffListResponse = z.object({
    staff: z.array(
        ProfileUpdateBody.extend({
            id: AuthStaffProfileId,
            userId: AuthUserId,
        })
    ),
    next: AuthStaffProfileId.nullable(),
})

export type StaffListResponse = z.infer<typeof StaffListResponse>
