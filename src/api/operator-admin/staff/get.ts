import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { jwt } from '../../../app/index.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { AuthProfileQuery } from '../../../model/query/staff/index.js'
import { StaffListResponse } from '../../../model/body/profile/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin]
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
