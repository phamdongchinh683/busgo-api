import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { requireRoles } from '../../../../../app/jwt/handler.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { TripStopPickupResponse } from '../../../../../model/body/trip/index.js'
import { TripScheduleIdParam } from '../../../../../model/params/trip-schedule/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { id } = request.params
        return await bus.operation.tripSchedule.getPickupStops(id)
    },

    schema: {
        params: TripScheduleIdParam,
        response: { 200: TripStopPickupResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
