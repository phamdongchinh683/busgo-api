import { api, endpoint, tags } from '../../app/api.js'
import { MessageResponse } from '../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 1,
            timeWindow: '10m',
        },
    },
    handler: async _request => {
        return {
            message: 'OK',
        }
    },
    schema: {
        response: {
            200: MessageResponse,
        },
        tags: tags(__filename),
    },
})
