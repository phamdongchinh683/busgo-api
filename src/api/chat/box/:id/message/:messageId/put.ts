import { api, bearer, endpoint, tags } from '../../../../../../app/api.js'
import { jwt } from '../../../../../../app/index.js'
import { bus } from '../../../../../../business/index.js'
import { MessageResponse } from '../../../../../../model/common.js'
import { ChatMessageIdParam } from '../../../../../../model/params/chat/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        const [boxId, messageId] = await Promise.all([
            bus.publicId.resolve('chatBox', request.params.id),
            bus.publicId.resolve('chatMessage', request.params.messageId),
        ])
        return bus.chat.message.recallMessage({
            userInfo,
            boxId,
            messageId,
        })
    },
    schema: {
        params: ChatMessageIdParam,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
