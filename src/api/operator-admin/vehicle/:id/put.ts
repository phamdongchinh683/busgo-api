import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import { VehicleBody, VehicleResponse } from '../../../../model/body/vehicle/index.js'
import { VehicleIdParam } from '../../../../model/params/vehicle/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.organization.vehicle.updateVehicle(request.params.id, {
            ...request.body,
            companyId: userInfo.companyId,
        })
    },
    schema: {
        params: VehicleIdParam,
        body: VehicleBody,
        response: { 200: VehicleResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
