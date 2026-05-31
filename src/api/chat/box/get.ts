import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { ChatBoxQuery } from '../../../model/query/chat/index.js'
import { ChatBoxResponse } from '../../../model/body/chat/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        return bus.chat.box.getBox(userInfo.id, request.query)
    },

    schema: {
        querystring: ChatBoxQuery,
        response: { 200: ChatBoxResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
