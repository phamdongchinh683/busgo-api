import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { TripScheduleResponse } from '../../../model/body/trip-schedule/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_ROLES } from '../../../database/auth/user/type.js'
import { TripScheduleFilter } from '../../../model/query/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        return bus.operation.tripSchedule.getTripSchedulesByCompanyId(
            request.query,
            userInfo.companyId
        )
    },

    schema: {
        querystring: TripScheduleFilter.omit({ from: true, to: true, date: true }),
        response: { 200: TripScheduleResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
