import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { UserBody, UserResponseMessage } from '../../../../model/body/user/index.js'
import { UserIdParam } from '../../../../model/params/user/index.js'
import { requireRoles } from '../../../../app/jwt/handler.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        const { userId } = request.params
        return await bus.auth.superAdmin.updateOne(userId, request.body)
    },

    schema: {
        params: UserIdParam,
        body: UserBody.partial().omit({ password: true }),
        response: { 200: UserResponseMessage.omit({ message: true }) },
        tags: tags(__filename),
        security: bearer,
    },
})
