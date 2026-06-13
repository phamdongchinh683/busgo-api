import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { ChatMessageBody } from '../../../../../model/body/chat/index.js'
import { MessageResponse } from '../../../../../model/common.js'
import { ChatBoxIdParam } from '../../../../../model/params/chat/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        const { id: boxId } = request.params
        return bus.chat.message.sendMessage(
            {
                userInfo,
            },
            {
                message: request.body.message,
                boxId,
            }
        )
    },
    schema: {
        params: ChatBoxIdParam,
        body: ChatMessageBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
