import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { auth } from '../../../../app/jwt/index.js'
import { DriverStatResponse } from '../../../../model/body/driver/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [AuthUserRole.enum.driver])
        return bus.organization.driverMonthlyStat.getDriverStat({
            driverId: userInfo.id,
        })
    },

    schema: {
        response: { 200: DriverStatResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
