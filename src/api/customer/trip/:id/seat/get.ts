import { TripIdParam } from '../../../../../model/params/trip/index.js'
import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripSeatResponse } from '../../../../../model/body/trip/index.js'
import { TripSeatQuery } from '../../../../../model/query/seat/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { id: tripId } = request.params
        const { stopOrderPickup, stopOrderDropoff } = request.query
        const result = await bus.organization.seat.getSeatsByTripId(
            tripId,
            stopOrderPickup,
            stopOrderDropoff
        )
        return {
            seats: result.seats.map(({ id, seatNumber, type, isAvailable }) => ({
                id,
                seatNumber,
                type,
                isAvailable,
            })),
        }
    },

    schema: {
        params: TripIdParam,
        querystring: TripSeatQuery,
        response: { 200: TripSeatResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
