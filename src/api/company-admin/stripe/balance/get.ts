import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { BalanceResponse } from '../../../../service/stripe/type.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { bus } from '../../../../business/index.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.payment.stripe.getBalance(userInfo.accountStripeId)
    },

    schema: {
        response: { 200: BalanceResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
