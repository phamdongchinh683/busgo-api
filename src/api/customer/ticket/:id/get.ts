import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { TicketResponse } from '../../../../model/body/ticket/index.js'
import { TicketIdParam } from '../../../../model/params/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { id } = request.params
        return bus.booking.ticket.detailTicket(id, userInfo.id)
    },

    schema: {
        params: TicketIdParam,
        response: { 200: TicketResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
