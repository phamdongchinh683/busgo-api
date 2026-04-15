import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { requireRoles } from '../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { CompanyAdminCreateBody } from '../../../model/body/company-admin/index.js'
import { AuthCompanyAdminSignUpResponse } from '../../../model/body/auth/index.js'

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
        requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return await bus.auth.superAdmin.createCompanyAdmin(request.body)
    },

    schema: {
        body: CompanyAdminCreateBody,
        response: { 200: AuthCompanyAdminSignUpResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
