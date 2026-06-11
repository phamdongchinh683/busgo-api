import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../database/auth/user/type.js'
import { PaymentDeleteResponse } from '../../../../model/body/payment/index.js'
import { PaymentTransactionCodeParam } from '../../../../model/query/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_FEATURE_ROLES.administration)
        return bus.payment.payment.updateByTransactionCode(request.params.code)
    },

    schema: {
        params: PaymentTransactionCodeParam,
        response: { 200: PaymentDeleteResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
