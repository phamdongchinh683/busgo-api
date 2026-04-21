import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { auth } from '../../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { UserIdParam } from '../../../../../model/params/user/index.js'
import {
    UserNewPasswordBody,
    UserNewPasswordResponse,
    UserResponse,
    UserUpdateBody,
} from '../../../../../model/body/user/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.auth.superAdmin.updateNewPassword(request.params.userId, request.body.password)
    },

    schema: {
        params: UserIdParam,
        body: UserNewPasswordBody,
        response: { 200: UserNewPasswordResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
