import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthSignInBody, AuthResponse } from '../../../model/body/auth/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 5,
            timeWindow: '30s',
        },
    },
    handler: async request => {
        return bus.auth.login.byUsernameEmailOrPhone(request.body, AuthUserRole.enum.super_admin)
    },

    schema: {
        body: AuthSignInBody,
        response: { 200: AuthResponse },
        tags: tags(__filename),
    },
})
