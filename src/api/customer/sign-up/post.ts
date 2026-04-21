import { AuthBody, AuthResponse } from '../../../model/body/auth/index.js'
import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const body = request.body
        return bus.auth.customer.register(body, AuthUserRole.enum.customer)
    },

    schema: {
        body: AuthBody,
        response: { 200: AuthResponse },
        tags: tags(__filename),
    },
})
