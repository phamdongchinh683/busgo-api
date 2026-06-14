import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import {
    ProfileUpdateCustomerBody,
    ProfileUpdateCustomerResponse,
} from '../../../model/body/profile/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        return bus.auth.profile.updateProfileCustomer(userInfo, request.body)
    },

    schema: {
        body: ProfileUpdateCustomerBody,
        response: { 200: ProfileUpdateCustomerResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
