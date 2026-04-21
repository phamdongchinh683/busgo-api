import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { TripBody, TripPrepareResponse } from '../../../../model/body/trip/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.operation.trip.prepareTrip(request.body)
    },

    schema: {
        body: TripBody,
        response: { 200: TripPrepareResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
