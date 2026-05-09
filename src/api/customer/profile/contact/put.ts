import { api, endpoint, tags, bearer } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import {
    ProfileUpdateContactBody,
    ProfileUpdateContactResponse,
} from '../../../../model/body/profile/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requiredAuthenticate(request.headers)
        return bus.auth.profile.updateContactInfo(userInfo, request.body)
    },

    schema: {
        body: ProfileUpdateContactBody,
        response: { 200: ProfileUpdateContactResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
