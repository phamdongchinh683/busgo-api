import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { TicketSupportFilter } from '../../../model/query/ticket/index.js'
import { TicketSupportResponse } from '../../../model/body/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        return bus.booking.ticket.getTicketsSupport(request.query, userInfo.companyId)
    },

    schema: {
        querystring: TicketSupportFilter,
        response: { 200: TicketSupportResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
