import { z } from 'zod'

export const OrganizationBusCompanyId = z.coerce.number().brand<'organization.bus_company.id'>()
export type OrganizationBusCompanyId = z.infer<typeof OrganizationBusCompanyId>
