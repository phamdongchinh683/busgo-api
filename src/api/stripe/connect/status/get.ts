import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { StripeStatusResponse } from '../../../../service/stripe/type.js'
import { jwt } from '../../../../app/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        return bus.payment.payment.stripeStatus(userInfo)
    },
    schema: {
        response: { 200: StripeStatusResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
