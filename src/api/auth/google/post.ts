import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthGoogleBody, AuthResponse } from '../../../model/body/auth/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const body = request.body
        return bus.auth.google.verifyToken({ payload: body })
    },
    schema: {
        body: AuthGoogleBody,
        response: { 200: AuthResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
