import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { PromotionNewsBody } from '../../../../model/body/promotion-new/index.js'
import { MessageResponse } from '../../../../model/common.js'
import { PromotionNewsIdParam } from '../../../../model/params/promotion-new/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        return bus.booking.promotionNew.updateOne({ id: request.params.id, body: request.body })
    },
    schema: {
        params: PromotionNewsIdParam,
        body: PromotionNewsBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
