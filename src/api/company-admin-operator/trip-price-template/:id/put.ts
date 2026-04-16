import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { requireStaffProfileRole } from '../../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../database/auth/staff_profile/type.js'
import {
    TripPriceTemplateBody,
    TripPriceTemplateResponse,
} from '../../../../model/body/trip-price-template/index.js'
import { TripPriceTemplateIdParam } from '../../../../model/params/trip-price-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.operator]
        )
        return await bus.operation.tripPriceTemplate.updateTripPriceTemplates({
            body: {
                ...request.body,
                companyId: userInfo.companyId,
            },
            id: request.params.id,
        })
    },

    schema: {
        params: TripPriceTemplateIdParam,
        body: TripPriceTemplateBody,
        response: { 200: TripPriceTemplateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
