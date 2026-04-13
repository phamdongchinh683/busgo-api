import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { requireStaffProfileRole } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { AuthVerifyAccountBody } from '../../../../model/body/auth/index.js'
import { MessageResponse } from '../../../../model/common.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'

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
        const userInfo = requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        const { id, status } = request.body
        return await bus.auth.superAdmin.verifyAccount({
            id,
            status,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        body: AuthVerifyAccountBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
