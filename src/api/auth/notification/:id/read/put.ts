import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { requiredAuthenticate } from '../../../../../app/jwt/handler.js'
import { bus } from '../../../../../business/index.js'
import { NotificationResponse } from '../../../../../model/body/notification/index.js'
import { NotificationIdParam } from '../../../../../model/params/notification/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 20,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        const userInfo = await requiredAuthenticate(request.headers)
        return await bus.auth.notification.markNotificationAsRead(request.params.id, userInfo.id)
    },
    schema: {
        params: NotificationIdParam,
        response: { 200: NotificationResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
