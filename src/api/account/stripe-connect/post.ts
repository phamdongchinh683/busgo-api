import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { requiredAuthenticate } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { AuthVerifyAccountBody } from '../../../model/body/auth/index.js'
import { MessageResponse } from '../../../model/common.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { StripeConnectResponse } from '../../../model/body/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requiredAuthenticate(request.headers)
        return bus.payment.payment.linkStripeAccount(userInfo)
    },
    schema: {
        response: { 200: StripeConnectResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
