import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { jwt } from '../../../../../../app/index.js'
import { bus } from '../../../../../../business/index.js'
import { OPERATOR_ROLES } from '../../../../../../database/auth/user/type.js'
import {
    TripUpdateRequestBody,
    TripUpdateResponse,
} from '../../../../../../model/body/trip/index.js'
import { TripScheduleTripIdParam } from '../../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const [scheduleId, tripId, routeId, vehicleId, driverIds] = await Promise.all([
            bus.publicId.resolve('tripSchedule', request.params.id),
            bus.publicId.resolve('trip', request.params.tripId),
            request.body.routeId ? bus.publicId.resolve('route', request.body.routeId) : undefined,
            request.body.vehicleId
                ? bus.publicId.resolve('vehicle', request.body.vehicleId)
                : undefined,
            request.body.driverIds
                ? Promise.all(request.body.driverIds.map(id => bus.publicId.resolve('user', id)))
                : request.body.driverIds,
        ])
        return bus.operation.trip.updateTrip(
            {
                scheduleId,
                tripId,
                companyId: userInfo.companyId,
            },
            {
                ...request.body,
                routeId,
                vehicleId,
                driverIds,
            }
        )
    },

    schema: {
        params: TripScheduleTripIdParam,
        body: TripUpdateRequestBody.omit({ scheduleId: true }),
        response: { 200: TripUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
