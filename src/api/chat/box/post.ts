import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { MessageResponse } from '../../../model/common.js'
import { ChatBoxBody } from '../../../model/body/chat/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [
            AuthUserRole.enum.operator,
            AuthUserRole.enum.super_admin,
        ])
        return bus.chat.box.createBox({
            token: request.headers.authorization ?? '',
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
