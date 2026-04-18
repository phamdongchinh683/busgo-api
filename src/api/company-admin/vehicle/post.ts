import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { VehicleBody, VehicleResponse } from '../../../model/body/vehicle/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.organization.vehicle.createVehicle({
            ...request.body,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        body: VehicleBody,
        response: { 200: VehicleResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
