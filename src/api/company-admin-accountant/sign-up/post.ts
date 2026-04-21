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

    handler: async request => {
        return bus.auth.adminRegister.register(request.body, AuthStaffProfileRole.enum.accountant)
    },

    schema: {
        body: AuthCompanyAdminSignUpBody,
        response: { 200: AuthCompanyAdminSignUpResponse },
        tags: tags(__filename),
    },
})
