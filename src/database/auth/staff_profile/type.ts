import { z } from 'zod'

export const AuthStaffProfileId = z.coerce.number().brand<'auth.staff_profile.id'>()
export type AuthStaffProfileId = z.infer<typeof AuthStaffProfileId>

export const AuthStaffProfileRole = z.enum(['dispatcher', 'support', 'company_admin'])
export type AuthStaffProfileRole = z.infer<typeof AuthStaffProfileRole>
