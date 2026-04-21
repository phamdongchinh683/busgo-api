import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { auth } from '../../../../../../app/jwt/index.js'
import { bus } from '../../../../../../business/index.js'
import { AuthStaffProfileRole } from '../../../../../../database/auth/staff_profile/type.js'
import { AuthUserRole } from '../../../../../../database/auth/user/type.js'
import { TripUpdateBody, TripUpdateResponse } from '../../../../../../model/body/trip/index.js'
import { TripScheduleTripIdParam } from '../../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return bus.operation.trip.updateTrip(
            {
                scheduleId: request.params.id,
                tripId: request.params.tripId,
            },
            request.body
        )
    },

    schema: {
        params: TripScheduleTripIdParam,
        body: TripUpdateBody,
        response: { 200: TripUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
