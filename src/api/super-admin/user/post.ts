import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { UserBody, UserResponseMessage } from '../../../model/body/user/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.auth.superAdmin.createUser(request.body)
    },
    schema: {
        body: UserBody,
        response: { 200: UserResponseMessage },
        tags: tags(__filename),
        security: bearer,
    },
})
