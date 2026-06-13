import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { jwt } from '../../../../../app/index.js'
import { OPERATOR_ROLES } from '../../../../../database/auth/user/type.js'
import { DriverStatsResponse } from '../../../../../model/body/driver/index.js'
import { UserIdParam } from '../../../../../model/params/user/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const { id: userId } = request.params
        return bus.organization.driverMonthlyStat.getDriverDetail(userId, userInfo.companyId)
    },

    schema: {
        params: UserIdParam,
        response: { 200: DriverStatsResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
