import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { TripScheduleResponse } from '../../../model/body/trip-schedule/index.js'
import { TripScheduleFilter } from '../../../model/query/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.operation.tripSchedule.getTripSchedules(request.query)
    },
    schema: {
        querystring: TripScheduleFilter,
        response: { 200: TripScheduleResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
