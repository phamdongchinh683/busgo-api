import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { AuthProfileQuery } from '../../../model/query/staff/index.js'
import { StaffListResponse } from '../../../model/body/profile/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        const userInfo = requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return await bus.auth.profile.getStaffRole(request.query, userInfo.companyId)
    },

    schema: {
        querystring: AuthProfileQuery,
        response: { 200: StaffListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
