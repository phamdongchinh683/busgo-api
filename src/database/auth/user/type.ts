import { z } from 'zod'

export const AuthUserId = z.coerce.number().brand<'auth.user.id'>()
export type AuthUserId = z.infer<typeof AuthUserId>

export const AuthUserRole = z.enum(['agent', 'driver', 'customer', 'super_admin'])
export type AuthUserRole = z.infer<typeof AuthUserRole>

export const AuthUserStatus = z.enum(['active', 'inactive', 'banned'])
export type AuthUserStatus = z.infer<typeof AuthUserStatus>
