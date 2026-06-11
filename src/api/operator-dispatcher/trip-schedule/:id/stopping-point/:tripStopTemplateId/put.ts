import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { bus } from '../../../../../../business/index.js'
import { jwt } from '../../../../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../../../database/auth/user/type.js'
import { TripStopTemplateIdParam } from '../../../../../../model/params/trip-stop-template/index.js'
import {
    TripStopTemplateBody,
    TripStopTemplateUpdateResponse,
} from '../../../../../../model/body/trip-stop-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_FEATURE_ROLES.operations)
        const [scheduleId, tripStopTemplateId] = await Promise.all([
            bus.publicId.resolve('tripSchedule', request.params.id),
            bus.publicId.resolve('tripStopTemplate', request.params.tripStopTemplateId),
        ])
        return bus.operation.tripStopTemplate.updateStoppingPointById(tripStopTemplateId, {
            ...request.body,
            scheduleId,
        })
    },

    schema: {
        params: TripStopTemplateIdParam,
        body: TripStopTemplateBody,
        response: { 200: TripStopTemplateUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
