import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { TicketSupportFilter } from '../../../model/query/ticket/index.js'
import { TicketsResponse } from '../../../model/body/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.support]
        )
        return bus.booking.ticket.getTicketsSupport(request.query, userInfo.companyId)
    },

    schema: {
        querystring: TicketSupportFilter,
        response: { 200: TicketsResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
