import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import {
    AuthCompanyAdminSignUpBody,
    AuthCompanyAdminSignUpResponse,
} from '../../../model/body/auth/index.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        return await bus.auth.adminRegister.registerCompanyAdmin(request.body)
    },

    schema: {
        body: AuthCompanyAdminSignUpBody,
        response: { 200: AuthCompanyAdminSignUpResponse },
        tags: tags(__filename),
    },
})
