import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

function serializePublicIds(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(serializePublicIds)
    }

    if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) {
        return value
    }

    const source = value as Record<string, unknown>
    const result: Record<string, unknown> = {}

    for (const [key, item] of Object.entries(source)) {
        if (key !== 'publicId') {
            result[key] = serializePublicIds(item)
        }
    }

    if (typeof source.publicId === 'string') {
        result.id = source.publicId
    }

    return result
}

export const publicIdPlugin = fastifyPlugin(async (app: FastifyInstance) => {
    app.addHook('preSerialization', async (_request, _reply, payload) => {
        return serializePublicIds(payload)
    })
})
