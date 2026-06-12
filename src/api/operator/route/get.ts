import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_ROLES } from '../../../database/auth/user/type.js'
import { RouteFilter } from '../../../model/query/route/index.js'
import { OperationRoutesResponse } from '../../../model/body/route/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        return bus.operation.route.getRoutes(request.query)
    },

    schema: {
        querystring: RouteFilter,
        response: { 200: OperationRoutesResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
