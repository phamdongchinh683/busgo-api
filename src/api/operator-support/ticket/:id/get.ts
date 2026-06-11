import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../database/auth/user/type.js'
import { TicketSupportResponse } from '../../../../model/body/ticket/index.js'
import { TicketIdParam } from '../../../../model/params/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.support
        )
        const id = await bus.publicId.resolve('ticket', request.params.id)
        return bus.booking.ticket.detailTicketSupport(id, userInfo.companyId)
    },

    schema: {
        params: TicketIdParam,
        response: { 200: TicketSupportResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
