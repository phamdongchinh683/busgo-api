import { z } from 'zod'

export const OrganizationCompanyMemberId = z.coerce
    .number()
    .brand<'organization.company_member.id'>()
export type OrganizationCompanyMemberId = z.infer<typeof OrganizationCompanyMemberId>

export const OrganizationCompanyMemberPublicId = z
    .uuid()
    .brand<'organization.company_member.public_id'>()
export type OrganizationCompanyMemberPublicId = z.infer<typeof OrganizationCompanyMemberPublicId>
