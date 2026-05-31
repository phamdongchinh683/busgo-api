import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { DriverTripQuery } from '../../../model/query/trip/index.js'
import { jwt } from '../../../app/index.js'
import { DriverTripBody } from '../../../model/body/trip/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.driver])
        return bus.operation.trip.getDriverTrips(request.query, userInfo.id)
    },

    schema: {
        querystring: DriverTripQuery,
        response: { 200: DriverTripBody },
        tags: tags(__filename),
        security: bearer,
    },
})
