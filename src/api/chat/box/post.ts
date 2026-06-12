import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { MessageResponse } from '../../../model/common.js'
import { ChatBoxBody } from '../../../model/body/chat/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        await bus.publicId.resolve('user', request.body.receiverId)
        return bus.chat.box.createBox({
            userInfo: userInfo,
            body: request.body,
        })
    },
    schema: {
        body: ChatBoxBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
