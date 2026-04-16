import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { requiredAuthenticate } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { DeviceBody, DeviceResponse } from '../../../../model/body/device/index.js'

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
        const userInfo = await requiredAuthenticate(request.headers)
        return await bus.auth.device.addDevice({
            userId: userInfo.id,
            fcmToken: request.body.fcmToken,
        })
    },

    schema: {
        body: DeviceBody,
        response: { 200: DeviceResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
