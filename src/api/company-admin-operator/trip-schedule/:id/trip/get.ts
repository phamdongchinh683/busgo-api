import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { TripResponse } from '../../../../../model/body/trip/index.js'
import { auth } from '../../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripFilter } from '../../../../../model/query/trip/index.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.agent],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return bus.operation.trip.getTripByScheduleId(request.query, request.params.id)
    },

    schema: {
        params: TripScheduleIdParam,
        querystring: TripFilter.omit({ from: true, to: true }),
        response: { 200: TripResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
