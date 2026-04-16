import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { requireStaffProfileRole } from '../../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import { VehicleBody, VehicleResponse } from '../../../../model/body/vehicle/index.js'
import { VehicleIdParam } from '../../../../model/params/vehicle/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.accountant]
        )
        return await bus.organization.vehicle.updateVehicle(request.params.id, {
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
