import z from 'zod'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { Phone } from '../../common.js'

export const BusCompanyBody = z.object({
    name: z.string().min(5),
    hotline: Phone,
    logoUrl: z.string(),
    address: z.string(),
    lat: z.number().min(-90).max(90),
    long: z.number().min(-180).max(180),
})
export type BusCompanyBody = z.infer<typeof BusCompanyBody>

export const BusCompanyListResponse = z.object({
    companies: z.array(
        BusCompanyBody.extend({
            id: OrganizationBusCompanyId,
        })
    ),
    next: OrganizationBusCompanyId.nullable(),
})
export type BusCompanyListResponse = z.infer<typeof BusCompanyListResponse>

export const BusCompanyResponse = z.object({
    company: BusCompanyBody.extend({
        id: OrganizationBusCompanyId,
    }),
})
export type BusCompanyResponse = z.infer<typeof BusCompanyResponse>
