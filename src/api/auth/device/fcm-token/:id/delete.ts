import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { requiredAuthenticate } from '../../../../../app/jwt/handler.js'
import { bus } from '../../../../../business/index.js'
import { DeviceResponse } from '../../../../../model/body/device/index.js'
import { DeviceIdParam } from '../../../../../model/params/device/index.js'

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
        return await bus.auth.device.removeDevice(request.params.id)
    },

    schema: {
        params: DeviceIdParam,
        response: { 200: DeviceResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
