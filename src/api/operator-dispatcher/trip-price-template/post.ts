import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../database/auth/user/type.js'
import {
    TripPriceTemplateBody,
    TripPriceTemplateResponse,
} from '../../../model/body/trip-price-template/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.operations
        )
        return bus.operation.tripPriceTemplate.createTripPriceTemplate({
            body: {
                ...request.body,
                companyId: userInfo.companyId,
            },
        })
    },

    schema: {
        body: TripPriceTemplateBody.omit({ companyId: true }).required(),
        response: { 200: TripPriceTemplateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
