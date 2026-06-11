import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import {
    AuthCompanyAdminSignUpResponse,
    AuthOperatorStaffSignUpBody,
} from '../../../model/body/auth/index.js'
import { AuthUserRole, OPERATOR_FEATURE_ROLES } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.administration
        )
        return bus.auth.adminRegister.register(
            { ...request.body, companyId: userInfo.companyId },
            AuthUserRole.enum.operator_support
        )
    },

    schema: {
        body: AuthOperatorStaffSignUpBody,
        response: { 200: AuthCompanyAdminSignUpResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
