import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { StripeSetupIntentResponse } from '../../../../model/body/payment/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.payment.stripe.setUpIntent(userInfo)
    },

    schema: {
        response: { 200: StripeSetupIntentResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
