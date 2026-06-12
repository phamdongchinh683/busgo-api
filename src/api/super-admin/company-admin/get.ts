import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { CompanyAdminRequestQuery } from '../../../model/query/company-admin/index.js'
import { CompanyAdminListResponseSchema } from '../../../model/body/company-admin/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        const companyId = request.query.companyId
            ? await bus.publicId.resolve('busCompany', request.query.companyId)
            : undefined

        return bus.auth.superAdmin.listCompanyAdmins({
            ...request.query,
            companyId,
        })
    },

    schema: {
        querystring: CompanyAdminRequestQuery,
        response: { 200: CompanyAdminListResponseSchema },
        tags: tags(__filename),
        security: bearer,
    },
})
