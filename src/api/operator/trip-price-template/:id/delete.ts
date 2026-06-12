import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
import { OPERATOR_ROLES } from '../../../../database/auth/user/type.js'
import { TripPriceTemplateResponse } from '../../../../model/body/trip-price-template/index.js'
import { TripPriceTemplateIdParam } from '../../../../model/params/trip-price-template/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        const id = await bus.publicId.resolve('tripPriceTemplate', request.params.id)
        return bus.operation.tripPriceTemplate.deleteTripPriceTemplate({
            id,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        params: TripPriceTemplateIdParam,
        response: { 200: TripPriceTemplateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
