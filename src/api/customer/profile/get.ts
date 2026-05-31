import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { ProfileAccountResponse } from '../../../model/body/profile/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.auth.profile.getProfileCustomer(userInfo)
    },

    schema: {
        response: { 200: ProfileAccountResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
