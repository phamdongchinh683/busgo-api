import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { BusCompanyResponse } from '../../../model/body/bus-company/index.js'
import { BusCompanyListQuery } from '../../../model/query/bus-company/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.organization.busCompany.getOne(userInfo.companyId)
    },

    schema: {
        response: { 200: BusCompanyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
