import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { AuthVerifyAccountRequestBody } from '../../../model/body/auth/index.js'
import { MessageResponse } from '../../../model/common.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])
        const { id, status } = request.body
        const userId = await bus.publicId.resolve('user', id)
        return bus.auth.superAdmin.verifyAccount({
            id: userId,
            status,
        })
    },

    schema: {
        body: AuthVerifyAccountRequestBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
