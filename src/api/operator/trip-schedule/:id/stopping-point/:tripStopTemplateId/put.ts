import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { bus } from '../../../../../../business/index.js'
import { jwt } from '../../../../../../app/index.js'
import { OPERATOR_ROLES } from '../../../../../../database/auth/user/type.js'
import { TripStopTemplateIdParam } from '../../../../../../model/params/trip-stop-template/index.js'
import {
    TripStopTemplateRequestBody,
    TripStopTemplateUpdateResponse,
} from '../../../../../../model/body/trip-stop-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const { id: scheduleId, tripStopTemplateId } = request.params
        return bus.operation.tripStopTemplate.updateStoppingPointById(tripStopTemplateId, {
            ...request.body,
            scheduleId,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        params: TripStopTemplateIdParam,
        body: TripStopTemplateRequestBody.omit({ companyId: true, scheduleId: true }),
        response: { 200: TripStopTemplateUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
