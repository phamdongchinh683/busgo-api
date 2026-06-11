import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { jwt } from '../../../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../../database/auth/user/type.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'
import {
    TripStopTemplateBody,
    TripStopTemplateUpdateResponse,
} from '../../../../../model/body/trip-stop-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.operations
        )
        return bus.operation.tripStopTemplate.createStoppingPoint({
            body: {
                ...request.body,
                companyId: userInfo.companyId,
            },
            user: userInfo,
        })
    },
    schema: {
        params: TripScheduleIdParam,
        body: TripStopTemplateBody.omit({ companyId: true }),
        response: { 200: TripStopTemplateUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
