import z from 'zod'
import { OperationTripPriceTemplateId } from '../../../database/operation/trip_price_template/type.js'
import { OperationRouteId } from '../../../database/operation/route/type.js'

export const TripPriceTemplateFilter = z.object({
    routeId: OperationRouteId.optional(),
    limit: z.coerce.number().optional().default(10),
    next: OperationTripPriceTemplateId.optional(),
})

export type TripPriceTemplateFilter = z.infer<typeof TripPriceTemplateFilter>

export const TripPriceTemplateRequestFilter = TripPriceTemplateFilter.extend({})

export type TripPriceTemplateRequestFilter = z.infer<typeof TripPriceTemplateRequestFilter>
