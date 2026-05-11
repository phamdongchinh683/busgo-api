import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { PromotionNewsListResponse } from '../../../model/body/promotion-new/index.js'
import { PromotionNewsListQuery } from '../../../model/query/promotion-new/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            window: '1m',
        },
    },
    handler: async request => {
        return bus.booking.promotionNew.list(request.query)
    },
    schema: {
        querystring: PromotionNewsListQuery,
        response: { 200: PromotionNewsListResponse },
        tags: tags(__filename),
    },
})
