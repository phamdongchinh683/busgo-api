import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { CouponBody } from '../../../../model/query/coupon/index.js'
import { CouponIdParam } from '../../../../model/params/coupon/index.js'
import { CouponCreateResponse } from '../../../../model/body/coupon/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        const { id } = request.params
        return bus.booking.coupon.updateCoupon(id, {
            ...request.body,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        params: CouponIdParam,
        body: CouponBody,
        response: { 200: CouponCreateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
