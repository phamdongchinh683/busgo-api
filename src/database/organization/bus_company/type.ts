import { z } from 'zod'

export const OrganizationBusCompanyId = z.coerce.number().brand<'organization.bus_company.id'>()
export type OrganizationBusCompanyId = z.infer<typeof OrganizationBusCompanyId>

export const OrganizationBusCompanyPublicId = z.uuid().brand<'organization.bus_company.public_id'>()
export type OrganizationBusCompanyPublicId = z.infer<typeof OrganizationBusCompanyPublicId>
