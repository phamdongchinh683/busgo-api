import z from 'zod'
import { AuthUserStatus } from '../../../database/auth/user/type.js'
import { Email, Phone } from '../../common.js'
import { AuthStaffProfileId } from '../../../database/auth/staff_profile/type.js'

export const AuthProfileQuery = z.object({
    position: z.string().optional(),
    department: z.string().optional(),
    status: AuthUserStatus.optional(),
    code: z.string().optional(),
    email: Email.optional(),
    phone: Phone.optional(),
    identityNumber: z.string().min(12).nullable().optional(),
    limit: z.coerce.number().min(1).max(100).optional().default(10),
    next: AuthStaffProfileId.nullable().optional(),
})

export type AuthProfileQuery = z.infer<typeof AuthProfileQuery>
