import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { DriverSignUpBody } from '../../../model/body/auth/index.js'
import { MessageResponse } from '../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        return bus.auth.signup.registerDriver(request.body)
    },

    schema: {
        body: DriverSignUpBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
    },
})
