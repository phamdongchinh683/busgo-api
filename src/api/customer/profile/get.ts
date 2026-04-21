import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { ProfileAccountResponse } from '../../../model/body/profile/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requiredAuthenticate(request.headers)
        return bus.auth.profile.getProfileCustomer(userInfo)
    },

    schema: {
        response: { 200: ProfileAccountResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
