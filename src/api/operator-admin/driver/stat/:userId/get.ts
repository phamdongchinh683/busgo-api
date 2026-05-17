import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { auth } from '../../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { DriverStatsResponse } from '../../../../../model/body/driver/index.js'
import { UserIdParam } from '../../../../../model/params/user/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.organization.driverMonthlyStat.getDriverDetail(request.params.userId)
    },

    schema: {
        params: UserIdParam,
        response: { 200: DriverStatsResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
