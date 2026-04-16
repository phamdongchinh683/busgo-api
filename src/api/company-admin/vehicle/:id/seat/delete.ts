import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { MessageResponse } from '../../../../../model/common.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { requireStaffProfileRole } from '../../../../../app/jwt/handler.js'
import { VehicleIdParam } from '../../../../../model/params/vehicle/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return await bus.organization.seat.deleteSeat(request.params.id)
    },

    schema: {
        params: VehicleIdParam,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
