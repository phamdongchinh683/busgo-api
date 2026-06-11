import { OrganizationBusCompanyPublicId } from '../../../database/organization/bus_company/type.js'
import z from 'zod'

export const BusCompanyIdParam = z.object({
    id: OrganizationBusCompanyPublicId,
})
export type BusCompanyIdParam = z.infer<typeof BusCompanyIdParam>
