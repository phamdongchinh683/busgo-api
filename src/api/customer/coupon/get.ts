import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { CouponFilter } from '../../../model/query/coupon/index.js'
import { CouponsResponse } from '../../../model/body/coupon/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.booking.coupon.getCoupons(request.query)
    },

    schema: {
        querystring: CouponFilter,
        response: { 200: CouponsResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
