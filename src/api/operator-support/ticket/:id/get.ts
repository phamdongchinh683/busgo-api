import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { TicketSupportResponse } from '../../../../model/body/ticket/index.js'
import { TicketIdParam } from '../../../../model/params/ticket/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.support]
        )
        const { id } = request.params
        return bus.booking.ticket.detailTicketSupport(id, userInfo.companyId)
    },

    schema: {
        params: TicketIdParam,
        response: { 200: TicketSupportResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
