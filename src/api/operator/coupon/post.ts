import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { OPERATOR_ROLES } from '../../../database/auth/user/type.js'
import { CouponBody } from '../../../model/query/coupon/index.js'
import { CouponCreateResponse } from '../../../model/body/coupon/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        return bus.booking.coupon.createCoupon({ ...request.body, companyId: userInfo.companyId })
    },

    schema: {
        body: CouponBody,
        response: { 200: CouponCreateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
