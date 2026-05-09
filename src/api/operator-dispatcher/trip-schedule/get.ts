import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { TripScheduleResponse } from '../../../model/body/trip-schedule/index.js'
import { auth } from '../../../app/jwt/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { TripScheduleFilter } from '../../../model/query/trip-schedule/index.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.dispatcher]
        )
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
