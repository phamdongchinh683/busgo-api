import { api, bearer, endpoint, tags } from '../../../app/api.js'
import { auth } from '../../../app/jwt/index.js'
import { bus } from '../../../business/index.js'
import { NotificationsResponse } from '../../../model/body/notification/index.js'
import { NotificationQuery } from '../../../model/query/notification/index.js'

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
        const userInfo = await auth.requiredAuthenticate(request.headers)
        return bus.auth.notification.getMyNotifications(request.query, userInfo.id)
    },
    schema: {
        querystring: NotificationQuery,
        response: { 200: NotificationsResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
