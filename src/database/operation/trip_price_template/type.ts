import { z } from 'zod'

export const OperationTripPriceTemplateId = z.coerce
    .number()
    .brand<'operation.trip_price_template.id'>()
export type OperationTripPriceTemplateId = z.infer<typeof OperationTripPriceTemplateId>
