import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { MessageResponse } from '../../../../../model/common.js'
import { OPERATOR_ROLES } from '../../../../../database/auth/user/type.js'
import { jwt } from '../../../../../app/index.js'
import { VehicleIdParam } from '../../../../../model/params/vehicle/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const { id: vehicleId } = request.params
        return bus.organization.seat.deleteSeat(vehicleId, userInfo.companyId)
    },

    schema: {
        params: VehicleIdParam,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
