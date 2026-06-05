import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { SendEmailBody } from '../../../../model/body/email/index.js'
import { MessageResponse } from '../../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 10,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        await jwt.auth.requiredAuthenticate(request.headers)
        return bus.auth.email.sendTemplate(request.body)
    },
    schema: {
        body: SendEmailBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
