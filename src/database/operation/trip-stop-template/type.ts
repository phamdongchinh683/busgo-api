import { z } from 'zod'

export const OperationTripStopTemplateId = z.coerce
    .number()
    .brand<'operation.trip_stop_template.id'>()
export type OperationTripStopTemplateId = z.infer<typeof OperationTripStopTemplateId>

export const OperationTripStopTemplatePublicId = z
    .uuid()
    .brand<'operation.trip_stop_template.public_id'>()
export type OperationTripStopTemplatePublicId = z.infer<typeof OperationTripStopTemplatePublicId>
