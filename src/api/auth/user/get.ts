import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { UserListQuery, UserListResponse } from '../../../model/body/user/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requiredAuthenticate(request.headers)
        return bus.auth.superAdmin.listUsers(request.query)
    },

    schema: {
        querystring: UserListQuery,
        response: { 200: UserListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
