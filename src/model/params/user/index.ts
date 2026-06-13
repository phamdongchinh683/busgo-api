import { AuthUserId } from '../../../database/auth/user/type.js'
import z from 'zod'

export const UserIdParam = z.object({
    id: AuthUserId,
})

export type UserIdParam = z.infer<typeof UserIdParam>
