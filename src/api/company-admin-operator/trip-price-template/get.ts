import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'
import { TripPriceTemplateFilter } from '../../../model/query/trip-price-template/index.js'
import { TripPriceTemplateListResponse } from '../../../model/body/trip-price-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return bus.operation.tripPriceTemplate.getTripPriceTemplates({
            q: request.query,
            user: userInfo,
        })
    },

    schema: {
        querystring: TripPriceTemplateFilter,
        response: { 200: TripPriceTemplateListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
