import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { requireRoles } from '../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { DashboardResponseSchema } from '../../../model/body/dashboard/index.js'

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
        await requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return await bus.auth.superAdmin.getDashboard()
    },

    schema: {
        response: { 200: DashboardResponseSchema },
        tags: tags(__filename),
        security: bearer,
    },
})
