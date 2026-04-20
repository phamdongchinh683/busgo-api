import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { auth } from '../../../app/jwt/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { CompanyAdminCreateBody } from '../../../model/body/company-admin/index.js'
import { AuthCompanyAdminSignUpResponse } from '../../../model/body/auth/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.auth.superAdmin.createCompanyAdmin(request.body)
    },

    schema: {
        body: CompanyAdminCreateBody,
        response: { 200: AuthCompanyAdminSignUpResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
