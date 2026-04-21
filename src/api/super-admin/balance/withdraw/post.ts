import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { StripePayoutRequest, StripePayoutResponse } from '../../../../service/stripe/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireRoles(
            request.headers,
            [AuthUserRole.enum.super_admin],
        )

        return bus.payment.stripe.withdrawBalance({
            amount: request.body.amount,
            accountStripeId: userInfo.accountStripeId,
        })
    },

    schema: {
        body: StripePayoutRequest,
        response: { 200: StripePayoutResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
