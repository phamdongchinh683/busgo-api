import type { IncomingMessage } from 'http'
import { FastifyRequest } from 'fastify'
import { api, endpoint, tags } from '../../../app/api.js'
import { service } from '../../../service/index.js'

const __filename = new URL('', import.meta.url).pathname

type IncomingWithRawBody = IncomingMessage & { rawBody?: Buffer }

api.route({
    ...endpoint(__filename),

    handler: async (request: FastifyRequest) => {
        const signatureHeader = request.headers['stripe-signature']
        const signature = Array.isArray(signatureHeader)
            ? signatureHeader[0]
            : signatureHeader
        if (!signature) {
            throw new Error('Missing stripe-signature header')
        }

        const rawBody = (request.raw as IncomingWithRawBody).rawBody
        if (!rawBody?.length) {
            throw new Error(
                'Missing raw body for Stripe webhook. Raw bytes must be preserved for signature verification.'
            )
        }

        return service.stripe.webhook.handleWebhook(rawBody, signature)
    },

    schema: {
        tags: tags(__filename),
    },
})
