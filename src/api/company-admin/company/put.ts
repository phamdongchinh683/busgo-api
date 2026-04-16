import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { BusCompanyBody, BusCompanyResponse } from '../../../model/body/bus-company/index.js'

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
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return await bus.organization.busCompany.updateOne(userInfo.companyId, request.body)
    },

    schema: {
        body: BusCompanyBody.partial(),
        response: { 200: BusCompanyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
