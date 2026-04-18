import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { requireRoles } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { TicketCancelResponse } from '../../../../model/body/ticket/index.js'
import { TicketIdParam } from '../../../../model/params/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { id } = request.params
        return bus.booking.ticket.cancelTicket(id, userInfo.id)
    },

    schema: {
        params: TicketIdParam,
        response: { 200: TicketCancelResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
