import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { PaymentMethodResponse } from '../../../../model/body/payment/index.js'
import { PaymentMethodRequest } from '../../../../model/query/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const ip = request.headers['x-forwarded-for']?.toString().split(',')[0] ?? request.ip
        return bus.payment.payment.createPayment(request.body, userInfo.id, ip)
    },
    schema: {
        body: PaymentMethodRequest,
        response: { 200: PaymentMethodResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
