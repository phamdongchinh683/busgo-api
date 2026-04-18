import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { requireRoles } from '../../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { BusCompanyBody, BusCompanyResponse } from '../../../../model/body/bus-company/index.js'
import { BusCompanyIdParam } from '../../../../model/params/bus-company/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.organization.busCompany.updateOne(request.params.id, request.body)
    },

    schema: {
        params: BusCompanyIdParam,
        body: BusCompanyBody.partial(),
        response: { 200: BusCompanyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
