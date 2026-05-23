import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { auth } from '../../../../../app/jwt/index.js'
import { bus } from '../../../../../business/index.js'
import { NotificationResponse } from '../../../../../model/body/notification/index.js'
import { NotificationIdParam } from '../../../../../model/params/notification/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
 
    handler: async request => {
        const userInfo = await auth.requiredAuthenticate(request.headers)
        return bus.auth.notification.markNotificationAsRead(request.params.id, userInfo.id)
    },
    schema: {
        params: NotificationIdParam,
        response: { 200: NotificationResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
