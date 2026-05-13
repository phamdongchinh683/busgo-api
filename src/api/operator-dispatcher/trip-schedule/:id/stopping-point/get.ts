import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { auth } from '../../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'
import { TripStopTemplateResponse } from '../../../../../model/body/trip-stop-template/index.js'
import { OperationRouteQuery } from '../../../../../model/query/route/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.dispatcher]
        )
        return bus.operation.tripStopTemplate.getStoppingPoints({
            scheduleId: request.params.id,
            routeId: request.query.routeId,
        })
    },

    schema: {
        params: TripScheduleIdParam,
        querystring: OperationRouteQuery,
        response: { 200: TripStopTemplateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
