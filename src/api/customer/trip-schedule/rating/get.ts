import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { BusCompanyReviewListResponse } from '../../../../model/body/review/index.js'
import { BusCompanyReviewRequestFilter } from '../../../../model/query/review/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const { companyId } = request.query
        return bus.organization.review.getReviewByCompany({
            ...request.query,
            companyId,
        })
    },
    schema: {
        querystring: BusCompanyReviewRequestFilter,
        response: { 200: BusCompanyReviewListResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
