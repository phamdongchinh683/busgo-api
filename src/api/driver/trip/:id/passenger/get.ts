import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripPassengerResponse } from '../../../../../model/body/trip/index.js'
import { TripIdParam } from '../../../../../model/params/trip/index.js'
import { PassengerTicketFilter } from '../../../../../model/query/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.driver])
        return bus.operation.trip.getPassengerList(
            {
                driverId: userInfo.id,
                tripId: request.params.id,
            },
            request.query
        )
    },

    schema: {
        querystring: PassengerTicketFilter,
        params: TripIdParam,
        response: { 200: TripPassengerResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
