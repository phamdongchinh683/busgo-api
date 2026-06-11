import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../database/auth/user/type.js'

import { DriverListResponse } from '../../../model/body/driver/index.js'
import { DriverQuery } from '../../../model/query/driver/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.operations
        )
        return bus.auth.driver.getDrivers(request.query, userInfo.companyId)
    },

    schema: {
        querystring: DriverQuery,
        response: { 200: DriverListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
