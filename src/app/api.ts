import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import {
    jsonSchemaTransform,
    serializerCompiler,
    validatorCompiler,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { readdir, stat } from 'fs/promises'
import path, { dirname, parse, relative, sep } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { errorHandlerPlugin } from './plugins/error-handler.js'
import { rateLimitPlugin } from './plugins/rate-limit.js'
import { compressPlugin } from './plugins/compress.js'
import { corsPlugin } from './plugins/cors.js'
import { helmetPlugin } from './plugins/helmet.js'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = path.join(__dirname, '..')
const apiDir = path.join(rootDir, 'api')
const isProduction = process.env.NODE_ENV === 'production'

const swaggerFaviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#85e92c"/>
  <path d="M16 0c-8.823 0-16 7.177-16 16s7.177 16 16 16c8.823 0 16-7.177 16-16s-7.177-16-16-16zM16 1.527c7.995 0 14.473 6.479 14.473 14.473s-6.479 14.473-14.473 14.473c-7.995 0-14.473-6.479-14.473-14.473s6.479-14.473 14.473-14.473zM11.161 7.823c-0.188-0.005-0.375 0-0.568 0.005-1.307 0.079-2.093 0.693-2.312 1.964-0.151 0.891-0.125 1.796-0.188 2.692-0.020 0.464-0.067 0.928-0.156 1.38-0.177 0.813-0.525 1.068-1.353 1.109-0.111 0.011-0.22 0.032-0.324 0.057v1.948c1.5 0.073 1.704 0.605 1.823 2.172 0.048 0.573-0.015 1.147 0.021 1.719 0.027 0.543 0.099 1.079 0.208 1.6 0.344 1.432 1.745 1.911 3.433 1.624v-1.713c-0.272 0-0.511 0.005-0.74 0-0.579-0.016-0.792-0.161-0.844-0.713-0.079-0.713-0.057-1.437-0.099-2.156-0.089-1.339-0.235-2.651-1.541-3.5 0.672-0.495 1.161-1.084 1.312-1.865 0.109-0.547 0.177-1.099 0.219-1.651s-0.025-1.12 0.021-1.667c0.077-0.885 0.135-1.249 1.197-1.213 0.161 0 0.317-0.021 0.495-0.036v-1.745c-0.213 0-0.411-0.005-0.604-0.011zM21.287 7.839c-0.365-0.011-0.729 0.016-1.089 0.079v1.697c0.329 0 0.584 0 0.833 0.005 0.439 0.005 0.772 0.177 0.813 0.661 0.041 0.443 0.041 0.891 0.083 1.339 0.089 0.896 0.136 1.796 0.292 2.677 0.136 0.724 0.636 1.265 1.255 1.713-1.088 0.729-1.411 1.776-1.463 2.953-0.032 0.801-0.052 1.615-0.093 2.427-0.037 0.74-0.297 0.979-1.043 0.995-0.208 0.011-0.411 0.027-0.64 0.041v1.74c0.432 0 0.833 0.027 1.235 0 1.239-0.073 1.995-0.677 2.239-1.885 0.104-0.661 0.167-1.333 0.183-2.005 0.041-0.615 0.036-1.235 0.099-1.844 0.093-0.953 0.532-1.349 1.484-1.411 0.089-0.011 0.177-0.032 0.267-0.057v-1.953c-0.161-0.021-0.271-0.037-0.391-0.041-0.713-0.032-1.068-0.272-1.251-0.948-0.109-0.433-0.177-0.876-0.197-1.324-0.052-0.823-0.047-1.656-0.099-2.479-0.109-1.588-1.063-2.339-2.516-2.38zM12.099 14.875c-1.432 0-1.536 2.109-0.115 2.245h0.079c0.609 0.036 1.131-0.427 1.167-1.037v-0.061c0.011-0.62-0.484-1.136-1.104-1.147zM15.979 14.875c-0.593-0.020-1.093 0.448-1.115 1.043 0 0.036 0 0.067 0.005 0.104 0 0.672 0.459 1.099 1.147 1.099 0.677 0 1.104-0.443 1.104-1.136-0.005-0.672-0.459-1.115-1.141-1.109zM19.927 14.875c-0.624-0.011-1.145 0.485-1.167 1.115 0 0.625 0.505 1.131 1.136 1.131h0.011c0.567 0.099 1.135-0.448 1.172-1.104 0.031-0.609-0.521-1.141-1.152-1.141z" fill="#163646"/>
</svg>
`.trim()

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
            if (pathname === STRIPE_WEBHOOK_PATH) {
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

api.addHook('preHandler', async (request, reply) => {
    if (!request.url.includes('swagger') && !request.url.startsWith('/docs')) {
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
    if (!request.url.includes('swagger') && !request.url.startsWith('/docs')) {
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

    const registeredRoutes: Array<{ method: string; url: string; file: string }> = []

    await Promise.all(
        files.map(async file => {
            const { method, url } = endpoint(file)
            await import(pathToFileURL(file).href)
            registeredRoutes.push({ method, url, file: relative(apiDir, file) })
        })
    )
}

const start = async () => {
    try {
        await api.register(rateLimitPlugin)
        await api.register(compressPlugin)
        await api.register(helmetPlugin)
        await api.register(corsPlugin)
        await api.register(errorHandlerPlugin)
        await api.register(swagger, {
            openapi: {
                info: {
                    title: 'API',
                    description: 'API documentation for the Bus Ticketing System',
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

        await api.register(swaggerUI, {
            routePrefix: '/swagger/docs',
            theme: {
                title: 'API Docs',
                favicon: [
                    {
                        filename: 'favicon.svg',
                        rel: 'icon',
                        type: 'image/svg+xml',
                        sizes: '64x64',
                        content: Buffer.from(swaggerFaviconSvg),
                    },
                ],
            },
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false,
            },
        })

        await apiRouter(api)
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
        process.exit(1)
    }
}

start().catch(err => {
    process.exit(1)
})

export { api }
