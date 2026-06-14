import { api, endpoint, tags, bearer } from '../../../../../../app/api.js'
import { jwt } from '../../../../../../app/index.js'
import { bus } from '../../../../../../business/index.js'
import { AuthUserRole } from '../../../../../../database/auth/user/type.js'
import {
    TripUpdateRequestBody,
    TripUpdateResponse,
} from '../../../../../../model/body/trip/index.js'
import { TripScheduleTripIdParam } from '../../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        return bus.operation.trip.updateTrip(
            {
                scheduleId: request.params.id,
                tripId: request.params.tripId,
                companyId: userInfo.companyId,
            },
            {
                ...request.body,
            }
        )
    },

    schema: {
        params: TripScheduleTripIdParam,
        body: TripUpdateRequestBody.omit({ scheduleId: true }),
        response: { 200: TripUpdateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
