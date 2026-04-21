import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { MessageResponse } from '../../../model/common.js'
import { SeatCreateBody } from '../../../model/body/seat/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { auth } from '../../../app/jwt/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.organization.seat.createSeat(request.body)
    },

    schema: {
        body: SeatCreateBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
