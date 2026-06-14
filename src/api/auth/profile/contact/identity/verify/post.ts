import { api, bearer, endpoint, tags } from '../../../../../../app/api.js'
import { jwt } from '../../../../../../app/index.js'
import { bus } from '../../../../../../business/index.js'
import { ProfileUpdateContactBody } from '../../../../../../model/body/profile/index.js'
import { MessageResponse } from '../../../../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        return bus.auth.profile.verifyIdentity(userInfo, request.body)
    },
    schema: {
        body: ProfileUpdateContactBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
