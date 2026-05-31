import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { MarkReadResponse } from '../../../../../model/body/chat/index.js'
import { ChatBoxIdParam } from '../../../../../model/params/chat/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        return bus.chat.box.markRead(request.params.id, userInfo.id)
    },
    schema: {
        params: ChatBoxIdParam,
        response: { 200: MarkReadResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
