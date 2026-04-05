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
            entries.map(async (entry) => {
                const fullPath = path.join(dir, entry)
                const statInfo = await stat(fullPath)
                if (statInfo.isDirectory()) {
                    await walk(fullPath)
                } else if (statInfo.isFile() && allowedExtensions.includes(path.extname(fullPath))) {
                    files.push(fullPath)
                }
            })
        )
    }

    await walk(apiDir)

    const registeredRoutes: Array<{ method: string; url: string; file: string }> = []

    await Promise.all(
        files.map(async (file) => {
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
        api.log.error(err)
        process.exit(1)
    }
}

start().catch(err => {
    console.error(err)
    process.exit(1)
})

export { api }
