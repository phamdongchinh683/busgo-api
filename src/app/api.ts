import Fastify, { type FastifyInstance } from 'fastify'
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
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const rootDir = path.join(__dirname, '..')
const apiDir = path.join(rootDir, 'api')
const isProduction = process.env.NODE_ENV === 'production'

const swaggerFaviconSvg = `
<svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.172 17.51a5.163 5.163 0 01-3.64 1.507c-2.85 0-5.161-2.312-5.161-5.162s2.312-5.162 5.162-5.162a5.163 5.163 0 013.64 1.507l-1.442 1.442a3.123 3.123 0 00-2.198-.91c-1.722 0-3.118 1.396-3.118 3.123 0 1.726 1.396 3.123 3.118 3.123.843 0 1.606-.335 2.164-.877l1.473 1.359z" fill="#85EA2D"/>
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
