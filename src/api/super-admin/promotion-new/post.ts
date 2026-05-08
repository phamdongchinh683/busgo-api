import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import {
    PromotionNewsBody,
    PromotionNewsCreateResponse,
} from '../../../model/body/promotion-new/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.booking.promotionNew.createOne(userInfo.id, request.body)
    },
    schema: {
        body: PromotionNewsBody,
        response: { 200: PromotionNewsCreateResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
