import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../database/auth/user/type.js'
import { TripScheduleIdParam } from '../../../../model/params/trip-schedule/index.js'
import {
    TripScheduleUpdateResponse,
    TripScheduleUpdateBody,
} from '../../../../model/body/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.operations
        )
        const id = await bus.publicId.resolve('tripSchedule', request.params.id)
        return bus.operation.tripSchedule.updateTripSchedule({
            id,
            body: request.body,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        params: TripScheduleIdParam,
        body: TripScheduleUpdateBody,
        response: { 200: TripScheduleUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
