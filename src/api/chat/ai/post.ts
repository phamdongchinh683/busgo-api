import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { service } from '../../../service/index.js'
import { AiChatBody } from '../../../model/body/chat/index.js'
import { MessageResponse } from '../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 30,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        await jwt.auth.requiredAuthenticate(request.headers)

        return service.openai.chat({
            message: request.body.message,
        })
    },
    schema: {
        body: AiChatBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
