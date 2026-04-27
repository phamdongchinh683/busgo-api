import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import fastifyCors from '@fastify/cors'

export const corsPlugin = fastifyPlugin(async (app: FastifyInstance) => {
    const origins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',')
              .map(origin => origin.trim())
              .filter(Boolean)
        : ['*']

    await app.register(fastifyCors, {
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
        origin: origins,
    })
})
