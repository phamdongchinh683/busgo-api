import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import {
    TripScheduleRequestBody,
    TripScheduleUpdateResponse,
} from '../../../model/body/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        const { routeId } = request.body
        return bus.operation.tripSchedule.createTripSchedule({
            body: {
                ...request.body,
                routeId,
                companyId: userInfo.companyId,
            },
            user: userInfo,
        })
    },

    schema: {
        body: TripScheduleRequestBody.omit({ companyId: true }),
        response: { 200: TripScheduleUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
