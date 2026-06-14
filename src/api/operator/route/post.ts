import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import {
    OperationRouteBody,
    OperationRouteInsertResponse,
} from '../../../model/body/route/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        return bus.operation.route.createRoute({
            body: request.body,
        })
    },
    schema: {
        body: OperationRouteBody,
        response: { 200: OperationRouteInsertResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
