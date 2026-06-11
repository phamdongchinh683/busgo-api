import { OperationTripPriceTemplatePublicId } from '../../../database/operation/trip_price_template/type.js'
import z from 'zod'

export const TripPriceTemplateIdParam = z.object({
    id: OperationTripPriceTemplatePublicId,
})

export type TripPriceTemplateIdParam = z.infer<typeof TripPriceTemplateIdParam>
