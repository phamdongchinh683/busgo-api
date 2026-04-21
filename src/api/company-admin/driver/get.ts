import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { auth } from '../../../app/jwt/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

import { DriverListResponse } from '../../../model/body/driver/index.js'
import { DriverQuery } from '../../../model/query/driver/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [AuthUserRole.enum.admin])
        return bus.auth.driver.getDrivers(request.query, userInfo.companyId)
    },

    schema: {
        querystring: DriverQuery,
        response: { 200: DriverListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
