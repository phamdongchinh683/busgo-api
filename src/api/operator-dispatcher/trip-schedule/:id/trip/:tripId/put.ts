import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { jwt } from '../../../../../../app/index.js'
import { bus } from '../../../../../../business/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../../../database/auth/user/type.js'
import {
    TripUpdateRequestBody,
    TripUpdateResponse,
} from '../../../../../../model/body/trip/index.js'
import { TripScheduleTripIdParam } from '../../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_FEATURE_ROLES.operations)
        const [scheduleId, tripId, routeId, vehicleId, bodyScheduleId, driverIds] =
            await Promise.all([
                bus.publicId.resolve('tripSchedule', request.params.id),
                bus.publicId.resolve('trip', request.params.tripId),
                request.body.routeId
                    ? bus.publicId.resolve('route', request.body.routeId)
                    : undefined,
                request.body.vehicleId
                    ? bus.publicId.resolve('vehicle', request.body.vehicleId)
                    : undefined,
                request.body.scheduleId
                    ? bus.publicId.resolve('tripSchedule', request.body.scheduleId)
                    : undefined,
                request.body.driverIds
                    ? Promise.all(
                          request.body.driverIds.map(id => bus.publicId.resolve('user', id))
                      )
                    : request.body.driverIds,
            ])
        return bus.operation.trip.updateTrip(
            {
                scheduleId,
                tripId,
            },
            {
                ...request.body,
                routeId,
                vehicleId,
                scheduleId: bodyScheduleId,
                driverIds,
            }
        )
    },

    schema: {
        params: TripScheduleTripIdParam,
        body: TripUpdateRequestBody,
        response: { 200: TripUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
