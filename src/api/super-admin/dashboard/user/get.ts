import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { PeriodUserQuery } from '../../../../model/query/user/index.js'
import { PeriodResponse } from '../../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.auth.superAdmin.getPeriodUsers(request.query)
    },
    schema: {
        querystring: PeriodUserQuery,
        response: { 200: PeriodResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
