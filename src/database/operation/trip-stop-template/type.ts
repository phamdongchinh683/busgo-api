import { z } from 'zod'

export const OperationTripStopTemplateId = z.coerce
    .number()
    .brand<'operation.trip_stop_template.id'>()
export type OperationTripStopTemplateId = z.infer<typeof OperationTripStopTemplateId>
