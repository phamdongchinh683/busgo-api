import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { HttpErr } from '../index.js'
// Redis rate limiting temporarily disabled (using in-memory instead)

export const rateLimitPlugin = fastifyPlugin(async (app: FastifyInstance) => {
    await app.register(rateLimit, {
        global: false,
        // redis,   // commented out - no Redis for now
        nameSpace: 'rate-limit:',
        skipOnError: true,
        max: 4000,
        timeWindow: '1m',
        keyGenerator: req => req.ip,
        errorResponseBuilder: () => {
            throw new HttpErr.TooManyRequests('You have sent too many requests. Please try again later.')
        },
    })
})
