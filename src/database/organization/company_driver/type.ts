import { z } from 'zod'

export const OrganizationCompanyDriverId = z.coerce
    .number()
    .brand<'organization.company_driver.id'>()
export type OrganizationCompanyDriverId = z.infer<typeof OrganizationCompanyDriverId>
