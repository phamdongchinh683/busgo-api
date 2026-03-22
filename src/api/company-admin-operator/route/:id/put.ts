import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { requireStaffProfileRole } from '../../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import {
    OperationRouteBody,
    OperationRouteInsertResponse,
} from '../../../../model/body/route/index.js'
import { OperationRouteIdParam } from '../../../../model/params/route/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        const userInfo = requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return await bus.operation.route.updateRoute({
            id: request.params.id,
            body: request.body,
        })
    },
    schema: {
        params: OperationRouteIdParam,
        body: OperationRouteBody.partial(),
        response: { 200: OperationRouteInsertResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
