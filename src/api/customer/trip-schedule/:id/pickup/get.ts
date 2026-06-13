import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripStopPickupResponse } from '../../../../../model/body/trip/index.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.operation.tripSchedule.getPickupStopsPublic(request.params.id)
    },

    schema: {
        params: TripScheduleIdParam,
        response: { 200: TripStopPickupResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
