import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { MessageResponse } from '../../../model/common.js'
import { SeatCreateBody } from '../../../model/body/seat/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../database/auth/user/type.js'
import { jwt } from '../../../app/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_FEATURE_ROLES.administration)
        return bus.organization.seat.createSeat(request.body)
    },

    schema: {
        body: SeatCreateBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
