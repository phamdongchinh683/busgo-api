import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { requireStaffProfileRole } from '../../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import { UserIdParam } from '../../../../model/params/user/index.js'
import { UserResponse, UserUpdateBody } from '../../../../model/body/user/index.js'

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
        requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return await bus.auth.superAdmin.updateOne(request.params.userId, request.body)
    },

    schema: {
        params: UserIdParam,
        body: UserUpdateBody,
        response: { 200: UserResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
