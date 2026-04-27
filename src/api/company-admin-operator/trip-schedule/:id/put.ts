import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { auth } from '../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import { TripScheduleIdParam } from '../../../../model/params/trip-schedule/index.js'
import {
    TripScheduleUpdateResponse,
    TripScheduleUpdateBody,
} from '../../../../model/body/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.agent],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return bus.operation.tripSchedule.updateTripSchedule({
            id: request.params.id,
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
