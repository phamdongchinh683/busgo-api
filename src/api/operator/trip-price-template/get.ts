import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { TripPriceTemplateRequestFilter } from '../../../model/query/trip-price-template/index.js'
import { TripPriceTemplateListResponse } from '../../../model/body/trip-price-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        const routeId = request.query.routeId
        return bus.operation.tripPriceTemplate.getTripPriceTemplates({
            q: { ...request.query, routeId },
            user: userInfo,
        })
    },

    schema: {
        querystring: TripPriceTemplateRequestFilter,
        response: { 200: TripPriceTemplateListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
