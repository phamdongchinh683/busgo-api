import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { PaymentFilter, PaymentListResponse } from '../../../model/query/payment/index.js'

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
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.accountant]
        )
        return await bus.payment.payment.getPayments(request.query, userInfo.companyId)
    },

    schema: {
        querystring: PaymentFilter,
        response: { 200: PaymentListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
