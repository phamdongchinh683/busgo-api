import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripStopResponse } from '../../../../../model/body/trip/index.js'
import { TripPickupQuery } from '../../../../../model/query/trip/index.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { fromStationId, stopOrder } = request.query
        const id = await bus.publicId.resolve('tripSchedule', request.params.id)
        return bus.operation.tripSchedule.getDropoffStops(id, fromStationId, stopOrder)
    },

    schema: {
        params: TripScheduleIdParam,
        querystring: TripPickupQuery,
        response: { 200: TripStopResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
