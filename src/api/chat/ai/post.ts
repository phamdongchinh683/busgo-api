import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AiChatBody, AiChatResponse } from '../../../model/body/chat/index.js'

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
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])

        return bus.chat.ai.reply({
            userInfo,
            message: request.body.message,
            state: request.body.state,
        })
    },
    schema: {
        body: AiChatBody,
        response: { 200: AiChatResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
