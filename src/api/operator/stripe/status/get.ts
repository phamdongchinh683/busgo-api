import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { jwt } from '../../../../app/index.js'
import { StripeStatusResponse } from '../../../../service/stripe/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        return bus.payment.payment.stripeStatus(userInfo)
    },
    schema: {
        response: { 200: StripeStatusResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
