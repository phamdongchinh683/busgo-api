import z from 'zod'
import { OperationStationId } from '../../../database/operation/station/type.js'
import { OperationTripScheduleId } from '../../../database/operation/trip-schedule/type.js'
import { OperationRouteId } from '../../../database/operation/route/type.js'
import { OrganizationBusCompanyId } from '../../../database/organization/bus_company/type.js'
import { OperationTripStopTemplateId } from '../../../database/operation/trip-stop-template/type.js'

export const TripStopTemplateBody = z.object({
    companyId: OrganizationBusCompanyId,
    scheduleId: OperationTripScheduleId,
    allowPickup: z.boolean(),
    allowDropoff: z.boolean(),
    routeId: OperationRouteId,
    stopOrder: z.number(),
    stationId: OperationStationId,
})

export type TripStopTemplateBody = z.infer<typeof TripStopTemplateBody>

export const TripStopTemplateRequestBody = TripStopTemplateBody.extend({})

export type TripStopTemplateRequestBody = z.infer<typeof TripStopTemplateRequestBody>

export const TripStopTemplateResponse = z.object({
    stoppingPoints: z.array(
        TripStopTemplateRequestBody.extend({
            address: z.string(),
            city: z.string(),
        }).omit({ companyId: true, routeId: true })
    ),
})

export type TripStopTemplateResponse = z.infer<typeof TripStopTemplateResponse>

export const TripStopTemplateUpdateResponse = z.object({
    stoppingPoint: TripStopTemplateRequestBody.omit({ companyId: true }).extend({}),
})

export type TripStopTemplateUpdateResponse = z.infer<typeof TripStopTemplateUpdateResponse>
