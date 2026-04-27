import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { auth } from '../../../../app/jwt/index.js'
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

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return bus.operation.route.updateRoute({
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
