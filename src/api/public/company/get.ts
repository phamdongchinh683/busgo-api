import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { BusCompanyListResponse } from '../../../model/body/bus-company/index.js'
import { BusCompanyListQuery } from '../../../model/query/bus-company/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        return await bus.organization.busCompany.list(request.query)
    },

    schema: {
        querystring: BusCompanyListQuery,
        response: { 200: BusCompanyListResponse },
        tags: tags(__filename),
    },
})
