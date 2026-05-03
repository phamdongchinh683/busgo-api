import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import { TicketIdParam } from '../../../../model/params/ticket/index.js'
import { TicketCancelResponse } from '../../../../model/body/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.support]
        )
        return bus.booking.ticket.deleteTicket(request.params.id)
    },

    schema: {
        params: TicketIdParam,
        response: { 200: TicketCancelResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
