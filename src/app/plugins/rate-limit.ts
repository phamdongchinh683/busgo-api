import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { HttpErr } from '../index.js'
import { redis } from '../../datasource/redis.js'

export const rateLimitPlugin = fastifyPlugin(async (app: FastifyInstance) => {
    await app.register(rateLimit, {
        global: false,
        redis,
        nameSpace: 'rate-limit:',
        skipOnError: true,
        max: 4000,
        timeWindow: '1m',
        keyGenerator: req => req.ip,
        errorResponseBuilder: (request, context) => {
            throw new HttpErr.TooManyRequests(`Rate limit exceeded. Try again in ${context.after}`)
        },
    })
})
