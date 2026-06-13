import { z } from 'zod'

export const OrganizationCompanyMemberId = z.coerce
    .number()
    .brand<'organization.company_member.id'>()
export type OrganizationCompanyMemberId = z.infer<typeof OrganizationCompanyMemberId>
