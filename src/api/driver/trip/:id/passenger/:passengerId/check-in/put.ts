import { api, endpoint, tags, bearer } from '../../../../../../../app/api.js'
import { jwt } from '../../../../../../../app/index.js'
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
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.driver])
        const { passengerId, id } = request.params
        return bus.booking.ticket.checkInTicket({
            id: passengerId,
            status: request.body.ticketStatus,
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
