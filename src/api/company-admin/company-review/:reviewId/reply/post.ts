import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { auth } from '../../../../../app/jwt/index.js'
import { bus } from '../../../../../business/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { ReviewIdParam } from '../../../../../model/params/company_review/index.js'
import { ReplyCompanyReviewBody } from '../../../../../model/body/company_review/index.js'
import { MessageResponse } from '../../../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await auth.requireStaffProfileRole(
            request.headers, 
            [AuthUserRole.enum.operator], 
            [AuthStaffProfileRole.enum.company_admin]
        )
        const { reviewId } = request.params
        return bus.organization.companyReview.replyToReview(reviewId, request.body)
    },
    schema: {
        params: ReviewIdParam,
        body: ReplyCompanyReviewBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
