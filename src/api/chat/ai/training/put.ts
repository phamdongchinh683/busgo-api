import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import {
    AiTrainingTextResponse,
    AiTrainingTextUploadBody,
} from '../../../../model/body/chat/index.js'
import { service } from '../../../../service/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 5,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])

        const body = request.body
        const content = typeof body === 'string' ? body : body.content
        const fileName =
            typeof body === 'string'
                ? getHeaderValue(request.headers['x-file-name'])
                : body.fileName

        return service.openai.uploadTrainingText({
            content,
            fileName,
        })
    },
    schema: {
        body: AiTrainingTextUploadBody,
        response: { 200: AiTrainingTextResponse },
        tags: tags(__filename),
        security: bearer,
    },
})

function getHeaderValue(value: string | string[] | undefined) {
    if (Array.isArray(value)) return value[0]
    return value
}
