import { api, endpoint, tags } from '../../app/api.js'
import { z } from 'zod'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        return {
            status: 'ok',
        }
    },

    schema: {
        response: { 200: z.object({
            status: z.string(),
        }) },
        tags: tags(__filename),
    },
})
