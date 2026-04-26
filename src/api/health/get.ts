import { api, endpoint, tags } from '../../app/api.js'
import { z } from 'zod'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 2,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        return {
            message: 'OK',
        }
    },

    schema: {
        response: {
            200: z.object({
                message: z.string(),
            }),
        },
        tags: tags(__filename),
    },
})
