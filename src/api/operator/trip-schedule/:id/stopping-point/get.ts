import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { jwt } from '../../../../../app/index.js'
import { OPERATOR_ROLES } from '../../../../../database/auth/user/type.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'
import { TripStopTemplateResponse } from '../../../../../model/body/trip-stop-template/index.js'
import { OperationRouteRequestQuery } from '../../../../../model/query/route/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const { id: scheduleId } = request.params
        const { routeId } = request.query
        return bus.operation.tripStopTemplate.getStoppingPoints({
            scheduleId,
            routeId,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        params: TripScheduleIdParam,
        querystring: OperationRouteRequestQuery,
        response: { 200: TripStopTemplateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
