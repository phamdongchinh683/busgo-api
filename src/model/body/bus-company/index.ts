import z from 'zod'
import {
    OrganizationBusCompanyId,
    OrganizationBusCompanyPublicId,
} from '../../../database/organization/bus_company/type.js'
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
            id: OrganizationBusCompanyPublicId,
            reviewCount: z.number().int().min(0),
            reviewAvgStars: z.number().min(0).max(5),
        })
    ),
    next: OrganizationBusCompanyId.nullable(),
})
export type BusCompanyListResponse = z.infer<typeof BusCompanyListResponse>

export const BusCompanyResponse = z.object({
    company: BusCompanyBody.extend({
        id: OrganizationBusCompanyPublicId,
        reviewCount: z.number().int().min(0),
        reviewAvgStars: z.number().min(0).max(5),
    }),
})
export type BusCompanyResponse = z.infer<typeof BusCompanyResponse>
