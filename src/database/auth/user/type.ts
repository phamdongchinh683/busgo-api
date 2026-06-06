import { z } from 'zod'

export const AuthUserId = z.coerce.number().brand<'auth.user.id'>()
export type AuthUserId = z.infer<typeof AuthUserId>