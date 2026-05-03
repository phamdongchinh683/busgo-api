import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { bus } from '../../../../../../business/index.js'
import { auth } from '../../../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../../../database/auth/staff_profile/type.js'
import { TripStopTemplateIdParam } from '../../../../../../model/params/trip-stop-template/index.js'
import {
    TripStopTemplateBody,
    TripStopTemplateUpdateResponse,
} from '../../../../../../model/body/trip-stop-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        const { id, tripStopTemplateId } = request.params
        return bus.operation.tripStopTemplate.updateStoppingPointById(tripStopTemplateId, {
            ...request.body,
            scheduleId: id,
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
