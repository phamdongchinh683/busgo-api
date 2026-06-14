import z from 'zod'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { Phone } from '../../common.js'

export const BusCompanyBody = z.object({
    name: z.string().min(5),
    hotline: Phone,
    logoUrl: z.string(),
    address: z.string(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
})
export type BusCompanyBody = z.infer<typeof BusCompanyBody>

export const BusCompanyListResponse = z.object({
    companies: z.array(
        BusCompanyBody.extend({
            id: OrganizationBusCompanyId,
            star1: z.number().int().min(0),
            star2: z.number().int().min(0),
            star3: z.number().int().min(0),
            star4: z.number().int().min(0),
            star5: z.number().int().min(0),
        })
    ),
    next: OrganizationBusCompanyId.nullable(),
})
export type BusCompanyListResponse = z.infer<typeof BusCompanyListResponse>

export const BusCompanyResponse = z.object({
    company: BusCompanyBody.extend({
        star1: z.number().int().min(0),
        star2: z.number().int().min(0),
        star3: z.number().int().min(0),
        star4: z.number().int().min(0),
        star5: z.number().int().min(0),
    }),
})
export type BusCompanyResponse = z.infer<typeof BusCompanyResponse>
