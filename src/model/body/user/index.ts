import { Email, MessageResponse, Phone, UserInfo } from '../../common.js'
import { AuthUserId, AuthUserRole, AuthUserStatus } from '../../../database/auth/user/type.js'
import z from 'zod'
import { AuthPassword } from '../auth/index.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const UserBody = z.object({
    fullName: z.string().min(7),
    email: Email,
    phone: Phone.nullable(),
    status: AuthUserStatus,
    password: AuthPassword,
    role: AuthUserRole,
})

export type UserBody = z.infer<typeof UserBody>

export const UserUpdateBody = z.object({
    fullName: z.string().min(7).optional(),
    email: Email.optional(),
    phone: Phone.optional(),
    status: AuthUserStatus.optional(),
})

export type UserUpdateBody = z.infer<typeof UserUpdateBody>

export const UserResponse = z.object({
    user: UserInfo,
})

export type UserResponse = z.infer<typeof UserResponse>

export const UserNewPasswordBody = z.object({
    password: AuthPassword,
})

export type UserNewPasswordBody = z.infer<typeof UserNewPasswordBody>

export const UserNewPasswordResponse = z.object({
    ...MessageResponse.shape,
    password: AuthPassword,
})

export type UserNewPasswordResponse = z.infer<typeof UserNewPasswordResponse>

export const UserUpdatePasswordBody = z.object({
    oldPassword: AuthPassword,
    newPassword: AuthPassword,
})

export type UserUpdatePasswordBody = z.infer<typeof UserUpdatePasswordBody>

export const UserListResponse = z.object({
    users: z.array(
        UserBody.extend({
            id: AuthUserId,
        }).omit({ password: true }),
    ),
    next: AuthUserId.nullable(),
})

export type UserListResponse = z.infer<typeof UserListResponse>

export const UserListQuery = z.object({
    status: AuthUserStatus.optional(),
    role: AuthUserRole.optional(),
    companyId: OrganizationBusCompanyId.optional(),
    email: Email.optional(),
    phone: Phone.nullable().optional(),
    limit: z.coerce.number().min(1).optional().default(10),
    next: AuthUserId.optional(),
})

export type UserListQuery = z.infer<typeof UserListQuery>

export const UserResponseMessage = z.object({
    ...MessageResponse.shape,
    user: UserBody.extend({
        id: AuthUserId,
    }).omit({ password: true }),
})

export type UserResponseMessage = z.infer<typeof UserResponseMessage>
