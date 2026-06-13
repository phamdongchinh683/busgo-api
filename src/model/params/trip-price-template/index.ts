import { OperationTripPriceTemplateId } from '../../../database/operation/trip_price_template/type.js'
import z from 'zod'

export const TripPriceTemplateIdParam = z.object({
    id: OperationTripPriceTemplateId,
})

export type TripPriceTemplateIdParam = z.infer<typeof TripPriceTemplateIdParam>
