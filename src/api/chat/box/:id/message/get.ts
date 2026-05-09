import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { auth } from '../../../../../app/jwt/index.js'
import { bus } from '../../../../../business/index.js'
import { ChatBoxIdParam } from '../../../../../model/params/chat/index.js'
import { ChatMessageQuery } from '../../../../../model/query/chat/index.js'
import { ChatMessageResponse } from '../../../../../model/body/chat/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await auth.requiredAuthenticate(request.headers)
        return bus.chat.message.getMessages(
            {
                boxId: request.params.id,
            },
            request.query
        )
    },
    schema: {
        params: ChatBoxIdParam,
        querystring: ChatMessageQuery,
        response: { 200: ChatMessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
