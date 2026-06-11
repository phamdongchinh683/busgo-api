import { z } from 'zod'

export const OperationTripPriceTemplateId = z.coerce
    .number()
    .brand<'operation.trip_price_template.id'>()
export type OperationTripPriceTemplateId = z.infer<typeof OperationTripPriceTemplateId>

export const OperationTripPriceTemplatePublicId = z
    .uuid()
    .brand<'operation.trip_price_template.public_id'>()
export type OperationTripPriceTemplatePublicId = z.infer<typeof OperationTripPriceTemplatePublicId>
