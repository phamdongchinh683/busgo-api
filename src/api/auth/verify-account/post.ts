import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { requireRoles } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { AuthVerifyAccountBody } from '../../../model/body/auth/index.js'
import { MessageResponse } from '../../../model/common.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        const { id, status } = request.body
        return bus.auth.superAdmin.verifyAccount({
            id,
            status,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        body: AuthVerifyAccountBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
