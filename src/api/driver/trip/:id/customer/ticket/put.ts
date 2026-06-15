import { api, endpoint, bearer, tags } from '../../../../../../app/api.js'
import { jwt } from '../../../../../../app/index.js'
import { bus } from '../../../../../../business/index.js'
import { AuthUserRole } from '../../../../../../database/auth/user/type.js'
import { TripIdParam } from '../../../../../../model/params/trip/index.js'
import { TicketCheckInBody, TicketCheckInResponse } from '../../../../../../model/body/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.driver])
        const { id: tripId } = request.params
        const { id: ticketId, status } = request.body

        return bus.booking.ticket.updateTicketStatusForDriver({
            tripId,
            ticketId,
            driverId: userInfo.id,
            status,
        })
    },

    schema: {
        params: TripIdParam,
        body: TicketCheckInBody,
        response: { 200: TicketCheckInResponse },
        tags: tags(__filename),
        security: bearer,
    },
})