import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { requiredAuthenticate } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { StripeConnectResponse } from '../../../model/body/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requiredAuthenticate(request.headers)
        return bus.payment.stripe.linkStripeAccount(userInfo)
    },
    schema: {
        response: { 200: StripeConnectResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
