import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { requireRoles } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { TripScheduleResponse } from '../../../model/body/trip-schedule/index.js'
import { TripScheduleFilter } from '../../../model/query/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.customer])
        return await bus.operation.tripSchedule.getTripSchedules(request.query)
    },
    schema: {
        querystring: TripScheduleFilter,
        response: { 200: TripScheduleResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
