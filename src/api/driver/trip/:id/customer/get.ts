import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripIdParam } from '../../../../../model/params/trip/index.js'
import { TripPassengerResponse } from '../../../../../model/body/trip/index.js'
import { PassengerTicketFilter } from '../../../../../model/query/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.driver])
        const { id: tripId } = request.params
        return bus.booking.ticket.getTripPassengers(tripId, userInfo.id, request.query)
    },

    schema: {
        params: TripIdParam,
        querystring: PassengerTicketFilter,
        response: { 200: TripPassengerResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
