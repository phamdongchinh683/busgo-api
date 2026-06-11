import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../database/auth/user/type.js'
import {
    OperationRouteBody,
    OperationRouteInsertResponse,
} from '../../../../model/body/route/index.js'
import { OperationRouteIdParam } from '../../../../model/params/route/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_FEATURE_ROLES.operations)
        const id = await bus.publicId.resolve('route', request.params.id)
        return bus.operation.route.updateRoute({
            id,
            body: request.body,
        })
    },
    schema: {
        params: OperationRouteIdParam,
        body: OperationRouteBody.partial(),
        response: { 200: OperationRouteInsertResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
