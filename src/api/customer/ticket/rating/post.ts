import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { BusCompanyReviewBody } from '../../../../model/body/review/index.js'
import { MessageResponse } from '../../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.organization.review.createOne({
            userId: userInfo.id,
            body: request.body,
        })
    },
    schema: {
        body: BusCompanyReviewBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
