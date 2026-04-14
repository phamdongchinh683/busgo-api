import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { requiredAuthenticate } from '../../../app/jwt/handler.js'
import { bus } from '../../../business/index.js'
import { NotificationBody, NotificationResponse } from '../../../model/body/notification/index.js'

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
        const userInfo = requiredAuthenticate(request.headers)
        const { title, body, userId } = request.body
        return await bus.auth.notification.createNotification({ title, body, userId })
    },
    schema: {
        body: NotificationBody,
        response: { 200: NotificationResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
