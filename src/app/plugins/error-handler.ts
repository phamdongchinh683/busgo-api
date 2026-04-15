import {
    errorCodes,
    type FastifyError,
    type FastifyInstance,
    type FastifyReply,
    type FastifyRequest,
} from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { BadRequest } from '../../model/error.js'
import { HttpErr } from '../index.js'

export const errorHandlerPlugin = fastifyPlugin((app: FastifyInstance) => {
    app.setErrorHandler((err: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        if (hasZodFastifySchemaValidationErrors(err)) {
            const body: BadRequest = {
                issues: err.validation.map(v => ({
                    field: v.instancePath,
                    kind: v.keyword,
                    reason: v.message,
                })),
                location: err.validationContext,
            }
            return reply.code(400).send(body)
        }

        if (
            err instanceof HttpErr.UnprocessableEntity ||
            err instanceof HttpErr.Forbidden ||
            err instanceof HttpErr.Unauthorized ||
            err instanceof HttpErr.NotFound ||
            err instanceof HttpErr.TooManyRequests
        ) {
            console.log({
                businessError: {
                    method: request.method,
                    url: request.url,
                    status: err.status,
                    errorCode: err.errorCode,
                    message: err.message,
                    extra: err.extra,
                },
            })
            return reply.code(err.status).send({
                errorCode: err.errorCode,
                extra: err.extra,
                message: err.message,
            })
        }

        if (err instanceof errorCodes.FST_ERR_CTP_INVALID_JSON_BODY) {
            return reply.status(400).send({
                message: 'Invalid JSON in request body',
            })
        }

        console.error(err)
        return reply.code(500).send({
            message: 'Internal Server Error',
        })
    })
})
