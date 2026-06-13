import { api, endpoint, tags } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AuthGoogleBody, AuthResponse } from '../../../../model/body/auth/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        return bus.auth.google.verifyToken(
            {
                payload: request.body,
            },
            AuthUserRole.enum.operator
        )
    },
    schema: {
        body: AuthGoogleBody,
        response: { 200: AuthResponse },
        tags: tags(__filename),
    },
})
