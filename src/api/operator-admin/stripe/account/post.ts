import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { StripeConnectResponse } from '../../../../model/body/payment/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.administration
        )
        return bus.payment.stripe.linkStripeAccount(userInfo)
    },
    schema: {
        response: { 200: StripeConnectResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
