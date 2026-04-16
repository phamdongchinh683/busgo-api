import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { requireRoles } from '../../../../../app/jwt/handler.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripPassengerResponse } from '../../../../../model/body/trip/index.js'
import { TripIdParam } from '../../../../../model/params/trip/index.js'
import { PassengerTicketFilter } from '../../../../../model/query/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.driver])
        return await bus.operation.trip.getPassengerList(
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
