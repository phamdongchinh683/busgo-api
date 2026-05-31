import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
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

    handler: async request => {
        const userInfo = await jwt.auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.dispatcher]
        )
        return bus.operation.tripPriceTemplate.updateTripPriceTemplates({
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
