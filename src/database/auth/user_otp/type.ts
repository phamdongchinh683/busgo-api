import { z } from 'zod'

export const AuthUserOtpId = z.coerce.number().brand<'auth.user_otp.id'>()
export type AuthUserOtpId = z.infer<typeof AuthUserOtpId>
