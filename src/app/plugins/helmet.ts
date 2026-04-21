import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

export const helmetPlugin = fastifyPlugin(async (app: FastifyInstance) => {
    app.addHook('onSend', async (_request, reply, payload) => {
        reply.header('X-DNS-Prefetch-Control', 'off')
        reply.header('X-Frame-Options', 'SAMEORIGIN')
        reply.header('X-Content-Type-Options', 'nosniff')
        reply.header('Referrer-Policy', 'no-referrer')
        reply.header('X-Download-Options', 'noopen')
        reply.header('X-Permitted-Cross-Domain-Policies', 'none')
        reply.header('X-XSS-Protection', '0')
        reply.header('Cross-Origin-Opener-Policy', 'same-origin')
        reply.header('Cross-Origin-Resource-Policy', 'same-origin')
        reply.header('Origin-Agent-Cluster', '?1')

        return payload
    })
})
