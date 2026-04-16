import { TripIdParam } from '../../../../../model/params/trip/index.js'
import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { requireRoles } from '../../../../../app/jwt/handler.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripSeatResponse } from '../../../../../model/body/trip/index.js'
import { TripSeatQuery } from '../../../../../model/query/seat/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { id } = request.params
        const { stopOrderPickup, stopOrderDropoff } = request.query
        return await bus.organization.seat.getSeats({ id, stopOrderPickup, stopOrderDropoff })
    },

    schema: {
        params: TripIdParam,
        querystring: TripSeatQuery,
        response: { 200: TripSeatResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
