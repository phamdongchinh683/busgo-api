import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify'
import swagger from '@fastify/swagger'
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import qs from 'qs'
import { readdir, stat } from 'fs/promises'
import path, { dirname, parse, relative, sep } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { errorHandlerPlugin } from './plugins/error-handler.js'
import { rateLimitPlugin } from './plugins/rate-limit.js'
import { compressPlugin } from './plugins/compress.js'
import { corsPlugin } from './plugins/cors.js'
import { helmetPlugin } from './plugins/helmet.js'
import 'dotenv/config'
import fastifyStatic from '@fastify/static'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = path.join(__dirname, '..')
const apiDir = path.join(rootDir, 'api')
const isProduction = process.env.APP_ENV === 'production'
const enableHttpDebugLogs = process.env.ENABLE_HTTP_DEBUG_LOGS === 'true' && !isProduction

const api = Fastify({
    trustProxy: true,
    logger: {
        level: isProduction ? 'info' : 'debug',
    },
}).withTypeProvider<ZodTypeProvider>()

api.setValidatorCompiler(validatorCompiler)
api.setSerializerCompiler(serializerCompiler)

const STRIPE_WEBHOOK_PATH = '/stripe/webhook'
type RawWithStripeBody = import('http').IncomingMessage & { rawBody?: Buffer }

api.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (request: FastifyRequest, body: Buffer, done) => {
        try {
            const pathname = request.url.split('?')[0] ?? ''
            if (
                pathname === STRIPE_WEBHOOK_PATH ||
                pathname.startsWith(`${STRIPE_WEBHOOK_PATH}/`)
            ) {
                ;(request.raw as RawWithStripeBody).rawBody = body
            }
            const json = JSON.parse(body.toString('utf8')) as unknown
            done(null, json)
        } catch (err) {
            ;(err as { statusCode?: number }).statusCode = 400
            done(err as Error, undefined)
        }
    }
)

api.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    (_request: FastifyRequest, body: string, done) => {
        try {
            const parsed = qs.parse(body)
            done(null, parsed)
        } catch (err) {
            ;(err as { statusCode?: number }).statusCode = 400
            done(err as Error, undefined)
        }
    }
)

api.addHook('preHandler', async (request, reply) => {
    if (
        enableHttpDebugLogs &&
        !request.url.includes('swagger') &&
        !request.url.startsWith('/docs')
    ) {
        const preHandler = {
            method: request.method,
            url: request.url,
            params: request.params,
            query: request.query,
            body: request.body,
            headers: request.headers,
        }
        request.log.info({ preHandler })
    }
})

api.addHook('preSerialization', async (request, reply, response) => {
    if (
        enableHttpDebugLogs &&
        !request.url.includes('swagger') &&
        !request.url.startsWith('/docs')
    ) {
        request.log.info({
            preSerialization: {
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
            },
        })
    }
    return response
})

api.addHook('onSend', async (request, reply, payload) => {
    if (reply.hasHeader('cache-control')) return payload

    const pathname = request.url.split('?')[0] ?? ''
    const isSwaggerPath = pathname.includes('/swagger') || pathname.startsWith('/docs')
    if (isSwaggerPath) return payload

    if (request.method === 'GET' && pathname.startsWith('/public/')) {
        reply.header(
            'Cache-Control',
            `public, max-age=60, s-maxage=300, stale-while-revalidate=120`
        )
        return payload
    }

    reply.header('Cache-Control', 'no-store')
    return payload
})

export const bearer = [{ bearerAuth: [] }]

export const endpoint = (filename: string): { method: string; url: string } => {
    const method = parse(filename).name.toUpperCase()
    const normalizedPath = filename.replace(/\.(ts|js)$/, '')
    let url = dirname(relative(apiDir, normalizedPath))

    url = url.replace(/^\/+/, '') || '/'
    url = url === '/' ? '' : url

    url = url.replace(/\[([^\]]+)\]/g, ':$1')

    if (url && !url.startsWith('/')) {
        url = '/' + url
    }

    return { method, url: url || '/' }
}

export const tags = (filename: string): string[] => [
    relative(__dirname, filename).replace('../api/', '').split(sep)[0],
]

async function apiRouter(app: FastifyInstance) {
    const files: string[] = []
    const allowedExtensions = ['.ts', '.js']

    const walk = async (dir: string): Promise<void> => {
        const entries = await readdir(dir)
        await Promise.all(
            entries.map(async entry => {
                const fullPath = path.join(dir, entry)
                const statInfo = await stat(fullPath)
                if (statInfo.isDirectory()) {
                    await walk(fullPath)
                } else if (
                    statInfo.isFile() &&
                    allowedExtensions.includes(path.extname(fullPath))
                ) {
                    files.push(fullPath)
                }
            })
        )
    }

    await walk(apiDir)

    await Promise.all(files.map(file => import(pathToFileURL(file).href)))
}

const start = async () => {
    try {
        await api.register(rateLimitPlugin)
        await api.register(compressPlugin)
        await api.register(helmetPlugin)
        await api.register(corsPlugin)
        await api.register(errorHandlerPlugin)

        const publicDir = path.join(rootDir, '..', 'public')

        if (!isProduction) {
            await api.register(fastifyStatic, {
                root: publicDir,
                prefix: '/',
            })
        }

        await api.register(swagger, {
            openapi: {
                info: {
                    title: 'BusGo API',
                    description: 'API documentation for the BusGo',
                    version: '1.0.0',
                },
                components: {
                    securitySchemes: {
                        bearerAuth: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                        },
                    },
                },
            },
            transform: jsonSchemaTransform,
        })

        await apiRouter(api)

        api.get('/swagger/json', async () => api.swagger())

        if (!isProduction) {
            api.get('/swagger/docs', async (_request, reply) => {
                return reply.sendFile('swagger-dev.html')
            })
        }

        await api.ready()

        const port = process.env.PORT
        const host = process.env.HOST

        if (!port) throw new Error('env PORT not found')
        if (!host) throw new Error('env HOST not found')

        await api.listen({ host, port: +port })

        console.log({
            swagger: `http://${host}:${port}/swagger/docs`,
        })
    } catch (err) {
        api.log.error(err)
        process.exit(1)
    }
}

start().catch(err => {
    console.log(err)
    process.exit(1)
})

export { api }
