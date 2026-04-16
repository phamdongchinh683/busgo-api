import { api, endpoint, tags, bearer } from '../../../../../../../app/api.js'
import { requireRoles } from '../../../../../../../app/jwt/handler.js'
import { bus } from '../../../../../../../business/index.js'
import { AuthUserRole } from '../../../../../../../database/auth/user/type.js'
import { PassengerCheckInParam } from '../../../../../../../model/query/ticket/index.js'
import {
    TicketCheckInResponse,
    TicketStatusBody,
} from '../../../../../../../model/body/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.driver])
        const { passengerId, id } = request.params
        return await bus.booking.ticket.checkInTicket({
            id: passengerId,
            status: request.body.status,
            tripId: id,
        })
    },
    schema: {
        params: PassengerCheckInParam,
        body: TicketStatusBody,
        response: { 200: TicketCheckInResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
