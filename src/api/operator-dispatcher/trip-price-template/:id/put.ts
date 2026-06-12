import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { bus } from '../../../../business/index.js'
import { jwt } from '../../../../app/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../../database/auth/user/type.js'
import {
    TripPriceTemplateRequestBody,
    TripPriceTemplateResponse,
} from '../../../../model/body/trip-price-template/index.js'
import { TripPriceTemplateIdParam } from '../../../../model/params/trip-price-template/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.operations
        )
        const id = await bus.publicId.resolve('tripPriceTemplate', request.params.id)
        const [routeId, fromStationId, toStationId] = await Promise.all([
            request.body.routeId ? bus.publicId.resolve('route', request.body.routeId) : undefined,
            request.body.fromStationId
                ? bus.publicId.resolve('station', request.body.fromStationId)
                : undefined,
            request.body.toStationId
                ? bus.publicId.resolve('station', request.body.toStationId)
                : undefined,
        ])
        return bus.operation.tripPriceTemplate.updateTripPriceTemplates({
            body: {
                ...request.body,
                companyId: userInfo.companyId,
                routeId,
                fromStationId,
                toStationId,
            },
            id,
        })
    },

    schema: {
        params: TripPriceTemplateIdParam,
        body: TripPriceTemplateRequestBody.omit({ companyId: true }),
        response: { 200: TripPriceTemplateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
