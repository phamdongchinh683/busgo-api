import { z } from 'zod'

export const AuthUserId = z.coerce.number().brand<'auth.user.id'>()
export type AuthUserId = z.infer<typeof AuthUserId>

export const AuthUserPublicId = z.uuid().brand<'auth.user.public_id'>()
export type AuthUserPublicId = z.infer<typeof AuthUserPublicId>

export const AuthUserRole = z.enum(['operator', 'driver', 'customer', 'super_admin'])
export type AuthUserRole = z.infer<typeof AuthUserRole>

export const AUTH_USER_STATUS = {
    inactive: 0,
    active: 1,
} as const

export const AuthUserStatus = z.union([
    z.literal(AUTH_USER_STATUS.inactive),
    z.literal(AUTH_USER_STATUS.active),
])
export type AuthUserStatus = z.infer<typeof AuthUserStatus>

export const AuthUserStatusQuery = z.preprocess(value => {
    if (value === '0') return 0
    if (value === '1') return 1
    return value
}, AuthUserStatus)
export type AuthUserStatusQuery = z.infer<typeof AuthUserStatusQuery>
