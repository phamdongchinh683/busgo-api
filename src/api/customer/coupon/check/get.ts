import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { CouponApplyResponse } from '../../../../model/body/coupon/index.js'
import { CouponCheckCodeRequestQuery } from '../../../../model/query/coupon/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const companyId = request.query.companyId
            ? await bus.publicId.resolve('busCompany', request.query.companyId)
            : undefined

        return bus.booking.coupon.getCouponByCode({
            ...request.query,
            companyId,
        })
    },

    schema: {
        querystring: CouponCheckCodeRequestQuery,
        response: { 200: CouponApplyResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
