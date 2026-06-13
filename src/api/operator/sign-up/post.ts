import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import {
    AuthCompanyAdminSignUpRequestBody,
    AuthCompanyAdminSignUpResponse,
} from '../../../model/body/auth/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        return bus.auth.signup.registerOperator(request.body)
    },

    schema: {
        body: AuthCompanyAdminSignUpRequestBody,
        response: { 200: AuthCompanyAdminSignUpResponse },
        tags: tags(__filename),
    },
})
