import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { MessageResponse } from '../../../model/common.js'
import { SeatCreateBody } from '../../../model/body/seat/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'

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
            [AuthStaffProfileRole.enum.company_admin]
        )
        return await bus.organization.seat.createSeat(request.body)
    },

    schema: {
        body: SeatCreateBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
