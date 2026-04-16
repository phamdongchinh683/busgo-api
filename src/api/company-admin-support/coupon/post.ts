import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { requireStaffProfileRole } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { CouponBody } from '../../../model/query/coupon/index.js'
import { CouponCreateResponse } from '../../../model/body/coupon/index.js'
import { AuthStaffProfileRole } from '../../../database/auth/staff_profile/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin, AuthStaffProfileRole.enum.support]
        )
        return await bus.booking.coupon.createCoupon(request.body)
    },

    schema: {
        body: CouponBody,
        response: { 200: CouponCreateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
