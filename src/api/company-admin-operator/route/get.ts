import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { auth } from '../../../app/jwt/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { RouteFilter } from '../../../model/query/route/index.js'
import { OperationRoutesResponse } from '../../../model/body/route/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.agent],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return bus.operation.route.getRoutes(request.query)
    },

    schema: {
        querystring: RouteFilter,
        response: { 200: OperationRoutesResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
