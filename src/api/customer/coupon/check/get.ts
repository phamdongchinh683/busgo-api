import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { requireRoles } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { CouponApplyResponse, CouponResponse } from '../../../../model/body/coupon/index.js'
import { CouponCheckCodeQuery } from '../../../../model/query/coupon/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            window: '10s',
        },
    },
    handler: async request => {
        await requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.booking.coupon.getCouponByCode(request.query)
    },

    schema: {
        querystring: CouponCheckCodeQuery,
        response: { 200: CouponApplyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
