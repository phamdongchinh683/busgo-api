import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { OperationStationId } from '../../../database/operation/station/type.js'
import { OperationRouteId } from '../../../database/operation/route/type.js'
import z from 'zod'
import { OperationTripPriceTemplateId } from '../../../database/operation/trip_price_template/type.js'
import { StatusFlag } from '../../common.js'

export const TripPriceTemplateBody = z.object({
    companyId: OrganizationBusCompanyId.optional(),
    routeId: OperationRouteId.optional(),
    fromStationId: OperationStationId.optional(),
    toStationId: OperationStationId.optional(),
    price: z.number().optional(),
    status: StatusFlag.optional(),
})

export type TripPriceTemplateBody = z.infer<typeof TripPriceTemplateBody>

export const TripPriceTemplateRequestBody = TripPriceTemplateBody.extend({})

export type TripPriceTemplateRequestBody = z.infer<typeof TripPriceTemplateRequestBody>

export const TripPriceTemplateItem = TripPriceTemplateRequestBody.omit({ companyId: true }).extend(
    {}
)

export type TripPriceTemplateItem = z.infer<typeof TripPriceTemplateItem>

export const TripPriceTemplateResponse = z.object({
    tripPriceTemplate: TripPriceTemplateItem.extend({}),
})

export type TripPriceTemplateResponse = z.infer<typeof TripPriceTemplateResponse>

export const TripPriceTemplateListResponse = z.object({
    prices: z.array(
        TripPriceTemplateItem.extend({
            fromStationAddress: z.string(),
            fromStationCity: z.string(),
            toStationAddress: z.string(),
            toStationCity: z.string(),
            routeFromLocation: z.string(),
            routeToLocation: z.string(),
        })
    ),
    next: OperationTripPriceTemplateId.nullable(),
})

export type TripPriceTemplateListResponse = z.infer<typeof TripPriceTemplateListResponse>
