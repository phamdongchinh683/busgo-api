import Fastify, { type FastifyRequest } from 'fastify'
import swagger from '@fastify/swagger'
import fastifyStatic from '@fastify/static'
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import qs from 'qs'
import { readdir } from 'fs/promises'
import path, { dirname, parse, relative, sep } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import 'dotenv/config'

import { errorHandlerPlugin } from './plugins/error-handler.js'
import { rateLimitPlugin } from './plugins/rate-limit.js'
import { corsPlugin } from './plugins/cors.js'
import { helmetPlugin } from './plugins/helmet.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = path.join(__dirname, '..')
const apiDir = path.join(rootDir, 'api')
const publicDir = path.resolve(process.cwd(), 'public')

const isProduction = process.env.APP_ENV === 'production'
const enableHttpDebugLogs = process.env.ENABLE_HTTP_DEBUG_LOGS === 'true' && !isProduction
const isTsRuntime = process.argv[1]?.endsWith('.ts') ?? false

const STRIPE_WEBHOOK_PATH = '/stripe/webhook'

type RawWithStripeBody = import('http').IncomingMessage & {
    rawBody?: Buffer
}

export const api = Fastify({
    trustProxy: true,
    logger: {
        level: isProduction ? 'info' : 'debug',
    },
}).withTypeProvider<ZodTypeProvider>()

api.setValidatorCompiler(validatorCompiler)
api.setSerializerCompiler(serializerCompiler)

function getPathname(url: string) {
    const index = url.indexOf('?')
    return index === -1 ? url : url.slice(0, index)
}

function isSwaggerPath(pathname: string) {
    return pathname.startsWith('/swagger')
}

api.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (request: FastifyRequest, body: Buffer, done) => {
        try {
            const pathname = getPathname(request.url)

            if (
                pathname === STRIPE_WEBHOOK_PATH ||
                pathname.startsWith(`${STRIPE_WEBHOOK_PATH}/`)
            ) {
                ;(request.raw as RawWithStripeBody).rawBody = body
            }

            done(null, JSON.parse(body.toString('utf8')) as unknown)
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
            done(null, qs.parse(body))
        } catch (err) {
            ;(err as { statusCode?: number }).statusCode = 400
            done(err as Error, undefined)
        }
    }
)

api.addHook('preHandler', async request => {
    if (!enableHttpDebugLogs) return

    const pathname = getPathname(request.url)
    if (isSwaggerPath(pathname)) return

    request.log.info({
        preHandler: {
            method: request.method,
            url: request.url,
            params: request.params,
            query: request.query,
        },
    })
})

api.addHook('onSend', async (request, reply, payload) => {
    if (reply.hasHeader('cache-control')) return payload

    const pathname = getPathname(request.url)

    if (isSwaggerPath(pathname)) return payload

    if (request.method === 'GET' && pathname.startsWith('/public/')) {
        reply.header(
            'Cache-Control',
            'public, max-age=60, s-maxage=300, stale-while-revalidate=120'
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

    return {
        method,
        url: url || '/',
    }
}

export const tags = (filename: string): string[] => {
    return [relative(__dirname, filename).replace('../api/', '').split(sep)[0]]
}

async function apiRouter() {
    const files: string[] = []
    const allowedExtensions = new Set(isTsRuntime ? ['.ts'] : ['.js'])

    const walk = async (dir: string): Promise<void> => {
        const entries = await readdir(dir, { withFileTypes: true })

        await Promise.all(
            entries.map(async entry => {
                const fullPath = path.join(dir, entry.name)

                if (entry.isDirectory()) {
                    await walk(fullPath)
                    return
                }

                if (entry.isFile() && allowedExtensions.has(path.extname(entry.name))) {
                    files.push(fullPath)
                }
            })
        )
    }

    await walk(apiDir)

    await Promise.all(files.map(file => import(pathToFileURL(file).href)))
}

async function registerPlugins() {
    await api.register(rateLimitPlugin)
    await api.register(helmetPlugin)
    await api.register(corsPlugin)
    await api.register(errorHandlerPlugin)
}

async function registerSwagger() {
    await api.register(swagger, {
        openapi: {
            info: {
                title: 'BusGo API',
                description: 'API documentation for BusGo',
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

    api.get('/swagger/json', async (_request, reply) => {
        return api.swagger()
    })
}

async function registerDevStatic() {
    if (isProduction) return

    await api.register(fastifyStatic, {
        root: publicDir,
        prefix: '/public/',
    })

    api.get('/swagger/docs', async (_request, reply) => {
        return reply.sendFile('swagger-dev.html')
    })
}

async function start() {
    try {
        const port = process.env.PORT
        const host = process.env.HOST

        if (!port) throw new Error('env PORT not found')
        if (!host) throw new Error('env HOST not found')

        await registerPlugins()
        await registerDevStatic()
        await registerSwagger()
        await apiRouter()

        await api.ready()

        await api.listen({
            host,
            port: Number(port),
        })

        const url = `http://${host}:${port}`

        console.log({
            swagger: isProduction ? `${url}/swagger/json` : `${url}/swagger/docs`,
        })
    } catch (err) {
        api.log.error(err)
        process.exit(1)
    }
}

start()
