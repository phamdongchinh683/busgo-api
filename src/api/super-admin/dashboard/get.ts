import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { DashboardResponseSchema } from '../../../model/body/dashboard/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.auth.superAdmin.getDashboard()
    },

    schema: {
        response: { 200: DashboardResponseSchema },
        tags: tags(__filename),
        security: bearer,
    },
})
