import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { requireRoles } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { TicketResponse } from '../../../../model/body/ticket/index.js'
import { TicketIdParam } from '../../../../model/params/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { id } = request.params
        return await bus.booking.ticket.detailTicket(id, userInfo.id)
    },

    schema: {
        params: TicketIdParam,
        response: { 200: TicketResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
