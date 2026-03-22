import z from 'zod'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'

export const BusCompanyListQuery = z.object({
    limit: z.coerce.number().min(1).max(100).default(10),
    name: z.string().optional(),
    next: OrganizationBusCompanyId.optional(),
})

export type BusCompanyListQuery = z.infer<typeof BusCompanyListQuery>
