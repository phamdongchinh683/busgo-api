import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { requireRoles } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { PeriodUserQuery } from '../../../../model/query/user/index.js'
import { PeriodResponse } from '../../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return await bus.auth.superAdmin.getPeriodUsers(request.query)
    },
    schema: {
        querystring: PeriodUserQuery,
        response: { 200: PeriodResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
