import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { TripResponse } from '../../../../../model/body/trip/index.js'
import { jwt } from '../../../../../app/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripFilter } from '../../../../../model/query/trip/index.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        const { id: scheduleId } = request.params
        return bus.operation.trip.getTripByScheduleId(request.query, scheduleId, userInfo.companyId)
    },

    schema: {
        params: TripScheduleIdParam,
        querystring: TripFilter.omit({ from: true, to: true }),
        response: { 200: TripResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
