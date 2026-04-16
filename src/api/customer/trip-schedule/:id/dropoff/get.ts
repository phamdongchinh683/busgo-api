import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { requireRoles } from '../../../../../app/jwt/handler.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripStopResponse } from '../../../../../model/body/trip/index.js'
import { TripPickupQuery } from '../../../../../model/query/trip/index.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { fromStationId, stopOrder } = request.query
        const { id } = request.params
        return await bus.operation.tripSchedule.getDropoffStops(id, fromStationId, stopOrder)
    },

    schema: {
        params: TripScheduleIdParam,
        querystring: TripPickupQuery,
        response: { 200: TripStopResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
