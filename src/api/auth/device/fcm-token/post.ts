import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { DeviceBody, DeviceResponse } from '../../../../model/body/device/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        return bus.auth.device.addDevice({
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
