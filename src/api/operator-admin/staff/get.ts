import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../database/auth/user/type.js'
import { jwt } from '../../../app/index.js'
import { AuthProfileQuery } from '../../../model/query/staff/index.js'
import { StaffListResponse } from '../../../model/body/profile/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.administration
        )
        return bus.auth.profile.getStaffRole(request.query, userInfo.companyId)
    },

    schema: {
        querystring: AuthProfileQuery,
        response: { 200: StaffListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
