import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { PeriodResponse } from '../../../../model/common.js'
import { PeriodPaymentQuery } from '../../../../model/query/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.payment.payment.getPeriodRevenue(request.query)
    },
    schema: {
        querystring: PeriodPaymentQuery,
        response: { 200: PeriodResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
