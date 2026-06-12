import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { NotificationResponse } from '../../../../../model/body/notification/index.js'
import { NotificationIdParam } from '../../../../../model/params/notification/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        const id = await bus.publicId.resolve('notification', request.params.id)
        return bus.auth.notification.markNotificationAsRead(id, userInfo.id, userInfo.publicId!)
    },
    schema: {
        params: NotificationIdParam,
        response: { 200: NotificationResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
