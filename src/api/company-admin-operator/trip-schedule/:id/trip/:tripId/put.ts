import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { requireStaffProfileRole } from '../../../../../../app/jwt/handler.js'
import { bus } from '../../../../../../business/index.js'
import { AuthStaffProfileRole } from '../../../../../../database/auth/staff_profile/type.js'
import { AuthUserRole } from '../../../../../../database/auth/user/type.js'
import { TripUpdateBody, TripUpdateResponse } from '../../../../../../model/body/trip/index.js'
import { TripScheduleTripIdParam } from '../../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return await bus.operation.trip.updateTrip(
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
