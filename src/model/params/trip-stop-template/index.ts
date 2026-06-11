import { OperationTripSchedulePublicId } from '../../../database/operation/trip-schedule/type.js'
import { OperationTripStopTemplatePublicId } from '../../../database/operation/trip-stop-template/type.js'
import z from 'zod'

export const TripStopTemplateIdParam = z.object({
    id: OperationTripSchedulePublicId,
    tripStopTemplateId: OperationTripStopTemplatePublicId,
})

export type TripStopTemplateIdParam = z.infer<typeof TripStopTemplateIdParam>
