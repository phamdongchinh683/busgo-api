import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { BalanceResponse } from '../../../service/stripe/type.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [
            AuthUserRole.enum.super_admin,
        ])
        return bus.payment.stripe.getPlatformBalance(userInfo)
    },

    schema: {
        response: { 200: BalanceResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
