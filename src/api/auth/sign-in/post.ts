import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthSignInBody, AuthResponse } from '../../../model/body/auth/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        return await bus.auth.login.byUsernameEmailOrPhone(request.body)
    },

    schema: {
        body: AuthSignInBody,
        response: { 200: AuthResponse },
        tags: tags(__filename),
    },
})
