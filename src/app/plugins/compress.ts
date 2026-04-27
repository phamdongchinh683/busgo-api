import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import compress from '@fastify/compress'

export const compressPlugin = fastifyPlugin(async (app: FastifyInstance) => {
    await app.register(compress, {
        global: true,
        threshold: 1024,
        encodings: ['br', 'gzip'],
    })
})
