import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../database/auth/user/type.js'
import { PaymentFilter, PaymentListResponse } from '../../../model/query/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.administration
        )
        return bus.payment.payment.getPayments(request.query, userInfo.companyId)
    },

    schema: {
        querystring: PaymentFilter,
        response: { 200: PaymentListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
