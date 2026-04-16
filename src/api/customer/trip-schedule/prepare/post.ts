import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { requireRoles } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { TripBody, TripPrepareResponse } from '../../../../model/body/trip/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.customer])
        return await bus.operation.trip.prepareTrip(request.body)
    },

    schema: {
        body: TripBody,
        response: { 200: TripPrepareResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
