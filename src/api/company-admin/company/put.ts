import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { auth } from '../../../app/jwt/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { BusCompanyBody, BusCompanyResponse } from '../../../model/body/bus-company/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.agent],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.organization.busCompany.updateOne(userInfo.companyId, request.body)
    },

    schema: {
        body: BusCompanyBody.partial(),
        response: { 200: BusCompanyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
