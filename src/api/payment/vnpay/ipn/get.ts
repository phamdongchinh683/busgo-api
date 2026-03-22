import { api, endpoint, tags } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { VnPayIpnResponse } from '../../../../model/body/payment/index.js'
import { VnPayIpnRequest } from '../../../../model/query/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async (request, reply) => {
        return await bus.payment.payment.vnpayIpn(request.query, reply)
    },
    schema: {
        querystring: VnPayIpnRequest,
        response: {
            200: VnPayIpnResponse,
        },
        tags: tags(__filename),
    },
})
