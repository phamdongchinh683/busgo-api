import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { requiredAuthenticate } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { NotificationBody } from '../../../model/body/notification/index.js'
import { MessageResponse } from '../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await requiredAuthenticate(request.headers)
        const { title, body, userId } = request.body
        return bus.auth.notification.createNotification({ title, body, userId })
    },
    schema: {
        body: NotificationBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
