import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { OPERATOR_ROLES } from '../../../../database/auth/user/type.js'
import { TicketIdParam } from '../../../../model/params/ticket/index.js'
import { TicketCancelResponse } from '../../../../model/body/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const { id } = request.params
        return bus.booking.ticket.deleteTicket(id, userInfo.companyId)
    },

    schema: {
        params: TicketIdParam,
        response: { 200: TicketCancelResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
