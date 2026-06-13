import { Email, MessageResponse, Phone } from '../../common.js'
import {
    AuthUserId,
    AuthUserRole,
    AuthUserStatus,
    AuthUserStatusQuery,
} from '../../../database/auth/user/type.js'
import z from 'zod'
import { AuthPassword } from '../auth/index.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const UserBody = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: Email,
    phone: Phone.nullable(),
    status: AuthUserStatus,
    password: AuthPassword,
    role: AuthUserRole,
})

export type UserBody = z.infer<typeof UserBody>

export const UserUpdateBody = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: Email.optional(),
    phone: Phone.optional(),
    status: AuthUserStatus.optional(),
})

export type UserUpdateBody = z.infer<typeof UserUpdateBody>

export const UserNewPasswordBody = z.object({
    password: AuthPassword,
})

export type UserNewPasswordBody = z.infer<typeof UserNewPasswordBody>

export const UserUpdatePasswordBody = z.object({
    oldPassword: AuthPassword,
    newPassword: AuthPassword,
})

export type UserUpdatePasswordBody = z.infer<typeof UserUpdatePasswordBody>

export const UserLoginProvider = z.enum(['google', 'facebook'])
export type UserLoginProvider = z.infer<typeof UserLoginProvider>

export const UserListResponse = z.object({
    users: z.array(
        UserBody.extend({
            email: Email.nullable(),
            facebookId: z.string().nullable(),
            googleId: z.string().nullable(),
        }).omit({ password: true })
    ),
    next: AuthUserId.nullable(),
})

export type UserListResponse = z.infer<typeof UserListResponse>

export const UserListQuery = z.object({
    status: AuthUserStatusQuery.optional(),
    role: AuthUserRole.optional(),
    companyId: OrganizationBusCompanyId.optional(),
    email: Email.optional(),
    phone: Phone.nullable().optional(),
    type: UserLoginProvider.optional(),
    limit: z.coerce.number().min(1).optional().default(10),
    next: AuthUserId.optional(),
})

export type UserListQuery = z.infer<typeof UserListQuery>

export const UserListRequestQuery = UserListQuery.extend({})

export type UserListRequestQuery = z.infer<typeof UserListRequestQuery>

export const UserResponseMessage = z.object({
    ...MessageResponse.shape,
    user: UserBody.extend({
        email: Email.nullable(),
    }).omit({ password: true }),
})

export type UserResponseMessage = z.infer<typeof UserResponseMessage>
