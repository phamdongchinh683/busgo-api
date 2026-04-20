import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { requireRoles } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { MessageResponse } from '../../../model/common.js'
import { StripeAttachPaymentMethodRequest } from '../../../service/stripe/type.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.payment.stripe.removePaymentMethod({
            user: userInfo,
            paymentMethodId: request.body.paymentMethodId,
        })
    },

    schema: {
        body: StripeAttachPaymentMethodRequest,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
