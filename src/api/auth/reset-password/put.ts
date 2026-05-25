import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthForgotPasswordBody } from '../../../model/body/auth/index.js'
import { MessageResponse } from '../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        return bus.auth.password.resetPassword(request.body)
    },
    schema: {
        body: AuthForgotPasswordBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
