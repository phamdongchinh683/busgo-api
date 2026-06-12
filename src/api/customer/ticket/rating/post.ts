import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { BusCompanyReviewRequestBody } from '../../../../model/body/review/index.js'
import { MessageResponse } from '../../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const [tripId, ticketId] = await Promise.all([
            bus.publicId.resolve('trip', request.body.tripId),
            bus.publicId.resolve('ticket', request.body.ticketId),
        ])
        return bus.organization.review.createOne({
            userId: userInfo.id,
            body: { ...request.body, tripId, ticketId },
        })
    },
    schema: {
        body: BusCompanyReviewRequestBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
