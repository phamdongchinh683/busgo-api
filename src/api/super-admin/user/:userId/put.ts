import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { UserResponseMessage, UserUpdateBody } from '../../../../model/body/user/index.js'
import { UserIdParam } from '../../../../model/params/user/index.js'
import { jwt } from '../../../../app/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        const userId = await bus.publicId.resolve('user', request.params.userId)
        return bus.auth.superAdmin.updateOne(userId, request.body)
    },

    schema: {
        params: UserIdParam,
        body: UserUpdateBody,
        response: { 200: UserResponseMessage.omit({ message: true }) },
        tags: tags(__filename),
        security: bearer,
    },
})
