import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { requireStaffProfileRole } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { MessageResponse } from '../../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.super_admin]
        )
        return await bus.operation.trip.cleanupTrips()
    },
    schema: {
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
