import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { requireRoles } from '../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

import { ProfileResponse } from '../../../model/body/profile/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.admin])
        return await bus.auth.profile.getProfile(userInfo)
    },

    schema: {
        response: { 200: ProfileResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
