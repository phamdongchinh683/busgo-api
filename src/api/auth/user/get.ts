import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { UserListQuery, UserListResponse } from '../../../model/body/user/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [
            AuthUserRole.enum.operator,
            AuthUserRole.enum.super_admin,
        ])
        return bus.auth.superAdmin.listUsers(request.query)
    },

    schema: {
        querystring: UserListQuery,
        response: { 200: UserListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
