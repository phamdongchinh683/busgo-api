import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { jwt } from '../../../../../../app/index.js'
import { bus } from '../../../../../../business/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../../../database/auth/user/type.js'
import { TripUpdateBody, TripUpdateResponse } from '../../../../../../model/body/trip/index.js'
import { TripScheduleTripIdParam } from '../../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_FEATURE_ROLES.operations)
        const [scheduleId, tripId] = await Promise.all([
            bus.publicId.resolve('tripSchedule', request.params.id),
            bus.publicId.resolve('trip', request.params.tripId),
        ])
        return bus.operation.trip.updateTrip(
            {
                scheduleId,
                tripId,
            },
            request.body
        )
    },

    schema: {
        params: TripScheduleTripIdParam,
        body: TripUpdateBody,
        response: { 200: TripUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
