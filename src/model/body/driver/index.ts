import { AuthUserId, AuthUserRole, AuthUserStatus } from '../../../database/auth/user/type.js'
import { Email, Phone } from '../../common.js'
import { z } from 'zod'

export const DriverResponse = z.object({
    id: AuthUserId,
    fullName: z.string(),
    email: Email,
    phone: Phone.nullable(),
    role: AuthUserRole,
    status: AuthUserStatus,
})

export type DriverResponse = z.infer<typeof DriverResponse>

export const DriverListResponse = z.object({
    drivers: z.array(DriverResponse),
    next: AuthUserId.nullable(),
})

export type DriverListResponse = z.infer<typeof DriverListResponse>
