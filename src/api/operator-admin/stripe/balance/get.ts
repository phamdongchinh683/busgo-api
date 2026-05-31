import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { BalanceResponse } from '../../../../service/stripe/type.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { bus } from '../../../../business/index.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.payment.stripe.getBalance(userInfo)
    },

    schema: {
        response: { 200: BalanceResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
