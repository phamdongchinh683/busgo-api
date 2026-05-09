import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { MessageResponse } from '../../../model/common.js'
import { ChatBoxBody } from '../../../model/body/chat/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await auth.requiredAuthenticate(request.headers)
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
