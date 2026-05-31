import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { BusCompanyResponse } from '../../../../model/body/bus-company/index.js'
import { BusCompanyIdParam } from '../../../../model/params/bus-company/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.organization.busCompany.deleteOne(request.params.id)
    },

    schema: {
        params: BusCompanyIdParam,
        response: { 200: BusCompanyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
