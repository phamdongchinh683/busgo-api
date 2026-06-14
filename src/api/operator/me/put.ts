import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { BusCompanyBody, BusCompanyResponse } from '../../../model/body/bus-company/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        return bus.organization.busCompany.updateOne(userInfo.companyId, request.body)
    },

    schema: {
        body: BusCompanyBody,
        response: { 200: BusCompanyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
