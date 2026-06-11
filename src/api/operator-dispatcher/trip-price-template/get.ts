import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../database/auth/user/type.js'
import { TripPriceTemplateFilter } from '../../../model/query/trip-price-template/index.js'
import { TripPriceTemplateListResponse } from '../../../model/body/trip-price-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.operations
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
