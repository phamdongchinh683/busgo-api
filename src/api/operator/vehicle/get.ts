import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_ROLES } from '../../../database/auth/user/type.js'
import { VehicleFilter } from '../../../model/query/vehicle/index.js'
import { VehicleListResponse } from '../../../model/body/vehicle/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        return bus.organization.vehicle.getVehicles(request.query, userInfo.companyId)
    },

    schema: {
        querystring: VehicleFilter,
        response: { 200: VehicleListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
