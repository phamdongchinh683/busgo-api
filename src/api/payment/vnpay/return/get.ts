import { api, endpoint, tags } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { VnPayIpnRequest } from '../../../../model/query/payment/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async (request, reply) => {
        return bus.payment.payment.vnpayReturn(request.query, reply)
    },
    schema: {
        querystring: VnPayIpnRequest,
        tags: tags(__filename),
    },
})
