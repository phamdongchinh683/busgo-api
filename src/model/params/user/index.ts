import { AuthUserPublicId } from '../../../database/auth/user/type.js'
import z from 'zod'

export const UserIdParam = z.object({
    userId: AuthUserPublicId,
})

export type UserIdParam = z.infer<typeof UserIdParam>
