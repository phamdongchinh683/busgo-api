import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { auth } from '../../../../../app/jwt/index.js'
import { bus } from '../../../../../business/index.js'
import { MarkReadResponse } from '../../../../../model/body/chat/index.js'
import { ChatBoxIdParam } from '../../../../../model/params/chat/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [
            AuthUserRole.enum.operator,
            AuthUserRole.enum.super_admin,
        ])
        return bus.chat.box.markRead(request.params.id, userInfo.id)
    },
    schema: {
        params: ChatBoxIdParam,
        response: { 200: MarkReadResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
