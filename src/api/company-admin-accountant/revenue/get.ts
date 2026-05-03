import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { auth } from '../../../app/jwt/index.js'
import { HttpErr } from '../../../app/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { RevenueResponse } from '../../../model/body/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.accountant]
        )
        return bus.payment.payment.getRevenueByCompanyId(userInfo.companyId)
    },

    schema: {
        response: { 200: RevenueResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
