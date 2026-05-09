import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import {
    ProfileUpdateContactBody,
    ProfileUpdateContactResponse,
} from '../../../../model/body/profile/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [
            AuthUserRole.enum.customer,
        ])
        return bus.auth.profile.updateContactInfo(userInfo, request.body)
    },

    schema: {
        body: ProfileUpdateContactBody,
        response: { 200: ProfileUpdateContactResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
