import { api, bearer, endpoint, tags } from '../../../../../../app/api.js'
import { auth } from '../../../../../../app/jwt/index.js'
import { bus } from '../../../../../../business/index.js'
import { ProfileUpdateContactBody } from '../../../../../../model/body/profile/index.js'
import { MessageResponse } from '../../../../../../model/common.js'
import { AuthUserRole } from '../../../../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.auth.profile.verifyIdentity(userInfo, request.body)
    },
    schema: {
        body: ProfileUpdateContactBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
