import { AuthUserPublicId } from '../../../database/auth/user/type.js'
import z from 'zod'

export const CompanyAdminIdParam = z.object({
    id: AuthUserPublicId,
})
export type CompanyAdminIdParam = z.infer<typeof CompanyAdminIdParam>
