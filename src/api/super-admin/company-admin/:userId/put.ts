import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { auth } from '../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { UserIdParam } from '../../../../model/params/user/index.js'
import { UserResponse, UserUpdateBody } from '../../../../model/body/user/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.auth.superAdmin.updateOne(request.params.userId, request.body)
    },

    schema: {
        params: UserIdParam,
        body: UserUpdateBody,
        response: { 200: UserResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
