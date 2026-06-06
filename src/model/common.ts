import z from 'zod'
import { AuthUserId } from '../database/auth/user/type.js'

function emailDomain(email: string): string {
  const i = email.lastIndexOf('@')
  if (i < 0) return ''
  return email.slice(i + 1).toLowerCase()
}

const EXAMPLE_EMAIL_DOMAIN = /^(?:.+\.)?example\.(?:com|org|net)$/i

export const Email = z.email().refine(v => !EXAMPLE_EMAIL_DOMAIN.test(emailDomain(v)), {
  message: 'Email cannot use example.com, example.org or example.net domains.',
})

export type Email = z.infer<typeof Email>

export const Phone = z
  .string()
  .trim()
  .regex(/^\d{10,13}$/, 'Phone number must contain only digits and be 10 to 13 characters long.')
export type Phone = z.infer<typeof Phone>

export const UserInfo = z.object({
  id: AuthUserId,
  email: Email.nullable(),
  phone: Phone.nullable(),
  role: z.string(),
  tokenVersion: z.number().int().nonnegative(),
})

export type UserInfo = z.infer<typeof UserInfo>

export const MessageResponse = z.object({
  message: z.string(),
})
export type MessageResponse = z.infer<typeof MessageResponse>
