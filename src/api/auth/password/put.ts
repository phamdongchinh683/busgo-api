import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { UserUpdatePasswordBody } from '../../../model/body/user/index.js'
import { MessageResponse } from '../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requiredAuthenticate(request.headers)

        return bus.auth.password.updatePassword(userInfo.id, request.body)
    },

    schema: {
        body: UserUpdatePasswordBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
