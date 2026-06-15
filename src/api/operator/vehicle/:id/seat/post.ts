import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { MessageResponse } from '../../../../../model/common.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { jwt } from '../../../../../app/index.js'
import { SeatCreateRequestBody } from '../../../../../model/body/seat/index.js'
import { VehicleIdParam } from '../../../../../model/params/vehicle/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        const { id } = VehicleIdParam.parse(request.params)
        return bus.organization.seat.createSeat(
            { ...request.body, vehicleId: id },
            userInfo.companyId
        )
    },

    schema: {
        params: VehicleIdParam,
        body: SeatCreateRequestBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})