import { FastifyRequest } from 'fastify'
import { api, endpoint, tags } from '../../../app/api.js'
import { service } from '../../../service/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async (request: FastifyRequest & { rawBody?: string }) => {
        const signature = request.headers['stripe-signature']
        if (!signature) {
            throw new Error('Missing stripe-signature header')
        }

        const rawBody = request.rawBody ?? JSON.stringify(request.body)

        return service.stripe.webhook.handleWebhook(rawBody as string, signature as string)
    },

    schema: {
        tags: tags(__filename),
    },
})
