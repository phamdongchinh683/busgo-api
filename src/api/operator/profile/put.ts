import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { auth } from '../../../app/jwt/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { ProfileResponseUser, ProfileUpdateBody } from '../../../model/body/profile/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [AuthUserRole.enum.operator])
        return bus.auth.profile.updateProfile(userInfo.id, request.body)
    },

    schema: {
        body: ProfileUpdateBody,
        response: { 200: ProfileResponseUser },
        tags: tags(__filename),
        security: bearer,
    },
})
