import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { requireRoles } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { StripeGetPaymentMethodsResponse } from '../../../service/stripe/type.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.payment.stripe.listPaymentMethods(userInfo)
    },

    schema: {
        response: { 200: StripeGetPaymentMethodsResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
