import z from 'zod'
import { AuthUserId, AuthUserStatusQuery } from '../../../database/auth/user/type.js'
import { Phone } from '../../common.js'

export const DriverQuery = z.object({
    phone: Phone.optional(),
    status: AuthUserStatusQuery.optional(),
    limit: z.coerce.number().optional().default(10),
    next: AuthUserId.optional(),
})

export type DriverQuery = z.infer<typeof DriverQuery>
