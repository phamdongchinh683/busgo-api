import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { MessageResponse } from '../../../model/common.js'
import { SeatCreateRequestBody } from '../../../model/body/seat/index.js'
import { OPERATOR_ROLES } from '../../../database/auth/user/type.js'
import { jwt } from '../../../app/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const { vehicleId } = request.body
        return bus.organization.seat.createSeat({ ...request.body, vehicleId }, userInfo.companyId)
    },

    schema: {
        body: SeatCreateRequestBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
