import { z } from 'zod'

export const AuthStaffProfileId = z.coerce.number().brand<'auth.staff_profile.id'>()
export type AuthStaffProfileId = z.infer<typeof AuthStaffProfileId>

export const AuthStaffProfileRole = z.enum(['operator', 'accountant', 'support', 'company_admin'])
export type AuthStaffProfileRole = z.infer<typeof AuthStaffProfileRole>
