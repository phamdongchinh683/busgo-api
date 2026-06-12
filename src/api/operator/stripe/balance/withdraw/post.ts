import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { OPERATOR_ROLES } from '../../../../../database/auth/user/type.js'
import { StripePayoutRequest, StripePayoutResponse } from '../../../../../service/stripe/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)

        return bus.payment.stripe.withdrawBalance({
            amount: request.body.amount,
            userInfo,
        })
    },

    schema: {
        body: StripePayoutRequest,
        response: { 200: StripePayoutResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
