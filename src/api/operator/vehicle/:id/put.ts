import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
import { OPERATOR_ROLES } from '../../../../database/auth/user/type.js'
import { VehicleBody, VehicleResponse } from '../../../../model/body/vehicle/index.js'
import { VehicleIdParam } from '../../../../model/params/vehicle/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const id = await bus.publicId.resolve('vehicle', request.params.id)
        return bus.organization.vehicle.updateVehicle(id, {
            ...request.body,
            companyId: userInfo.companyId,
        })
    },
    schema: {
        params: VehicleIdParam,
        body: VehicleBody.omit({ companyId: true }),
        response: { 200: VehicleResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
