import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AiChatPublicResponse, AiChatRequestBody } from '../../../model/body/chat/index.js'

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

        const response = await bus.agent.busgoAgent.reply({
            userInfo,
            message: request.body.message,
            state: await bus.agent.statePublicId.resolveState(request.body.state),
        })
        return bus.agent.statePublicId.publicResponse(response)
    },
    schema: {
        body: AiChatRequestBody,
        response: { 200: AiChatPublicResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
