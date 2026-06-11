import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { OPERATOR_FEATURE_ROLES } from '../../../database/auth/user/type.js'
import { CouponSupportFilter } from '../../../model/query/coupon/index.js'
import { CouponsResponse } from '../../../model/body/coupon/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, OPERATOR_FEATURE_ROLES.support)
        return bus.booking.coupon.getCouponsSupport(request.query)
    },

    schema: {
        querystring: CouponSupportFilter,
        response: { 200: CouponsResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
