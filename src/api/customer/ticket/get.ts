import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { requireRoles } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { TicketFilter } from '../../../model/query/ticket/index.js'
import { TicketsResponse } from '../../../model/body/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.customer])
        return await bus.booking.ticket.getTickets(request.query, userInfo.id)
    },

    schema: {
        querystring: TicketFilter,
        response: { 200: TicketsResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
