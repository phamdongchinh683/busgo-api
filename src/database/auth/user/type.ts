import { z } from 'zod'

export const AuthUserId = z.coerce.number().brand<'auth.user.id'>()
export type AuthUserId = z.infer<typeof AuthUserId>

export const AuthUserPublicId = z.uuid().brand<'auth.user.public_id'>()
export type AuthUserPublicId = z.infer<typeof AuthUserPublicId>

export const AuthOperatorRole = z.enum([
    'operator_admin',
    'operator_support',
    'operator_dispatcher',
])
export type AuthOperatorRole = z.infer<typeof AuthOperatorRole>

export const OPERATOR_ROLES: AuthOperatorRole[] = AuthOperatorRole.options

export const OPERATOR_FEATURE_ROLES = {
    administration: [AuthOperatorRole.enum.operator_admin],
    operations: [AuthOperatorRole.enum.operator_admin, AuthOperatorRole.enum.operator_dispatcher],
    support: [AuthOperatorRole.enum.operator_admin, AuthOperatorRole.enum.operator_support],
    shared: OPERATOR_ROLES,
}

export const AuthUserRole = z.enum([
    ...AuthOperatorRole.options,
    'driver',
    'customer',
    'super_admin',
])
export type AuthUserRole = z.infer<typeof AuthUserRole>

export const AuthUserStatus = z.enum(['active', 'inactive', 'banned'])
export type AuthUserStatus = z.infer<typeof AuthUserStatus>
