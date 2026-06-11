import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../database/auth/user/type.js'
import { TicketIdParam } from '../../../../model/params/ticket/index.js'
import { TicketCancelResponse } from '../../../../model/body/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_FEATURE_ROLES.support)
        const id = await bus.publicId.resolve('ticket', request.params.id)
        return bus.booking.ticket.deleteTicket(id)
    },

    schema: {
        params: TicketIdParam,
        response: { 200: TicketCancelResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
