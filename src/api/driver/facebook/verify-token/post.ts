import { api, endpoint, tags } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { AuthFacebookBody, AuthResponse } from '../../../../model/body/auth/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        return bus.auth.facebook.verifyToken({
            payload: request.body,
            role: AuthUserRole.enum.driver,
        })
    },
    schema: {
        body: AuthFacebookBody,
        response: { 200: AuthResponse },
        tags: tags(__filename),
    },
})
