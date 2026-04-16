import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { requireStaffProfileRole } from '../../../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'
import {
    TripStopTemplateBody,
    TripStopTemplateUpdateResponse,
} from '../../../../../model/body/trip-stop-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return await bus.operation.tripStopTemplate.createStoppingPoint({
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
