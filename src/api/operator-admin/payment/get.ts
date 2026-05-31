import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { PaymentFilter, PaymentListResponse } from '../../../model/query/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.payment.payment.getPayments(request.query, userInfo.companyId)
    },

    schema: {
        querystring: PaymentFilter,
        response: { 200: PaymentListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
