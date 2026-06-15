import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripIdParam } from '../../../../../model/params/trip/index.js'
import { TripUpdateStatusBody, TripUpdateStatusResponse } from '../../../../../model/body/trip/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.driver])
        const { id: tripId } = request.params
        const { status } = request.body

        return bus.operation.trip.updateTripStatus({
            id: tripId,
            status,
            userId: userInfo.id
        })
    },

    schema: {
        params: TripIdParam,
        body: TripUpdateStatusBody,
        response: { 200: TripUpdateStatusResponse },
        tags: tags(__filename),
        security: bearer,
    },
})