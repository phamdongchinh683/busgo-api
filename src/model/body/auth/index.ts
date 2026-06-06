import { z } from 'zod'
import { Email, Phone, UserInfo } from '../../common.js'

const regPassword = `^(?=.*[a-z])(?=.*\\d)(?=.*[#@\\$%&!\\*\\?\\^_])(?!.*\\s).+$`
const message =
  'Password must contain lowercase letters, numbers, a special character (# @ $ % & ! * ? ^ _) and no spaces.'

export const AuthPassword = z.string().regex(new RegExp(regPassword), message)
export type AuthPassword = z.infer<typeof AuthPassword>

export const AuthResponse = z.object({
  token: z.string(),
  user: UserInfo
})

export type AuthResponse = z.infer<typeof AuthResponse>

export const AuthSignInBody = z.object({
  phone: Phone.optional(),
  email: Email.optional(),
  password: AuthPassword,
})

export type AuthSignInBody = z.infer<typeof AuthSignInBody>

export const AuthGoogleBody = z.object({
  idToken: z.string(),
})

export type AuthGoogleBody = z.infer<typeof AuthGoogleBody>
