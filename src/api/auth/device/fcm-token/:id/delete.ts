import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { auth } from '../../../../../app/jwt/index.js'
import { bus } from '../../../../../business/index.js'
import { DeviceResponse } from '../../../../../model/body/device/index.js'
import { DeviceIdParam } from '../../../../../model/params/device/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requiredAuthenticate(request.headers)
        return bus.auth.device.removeDevice(request.params.id, userInfo.id)
    },

    schema: {
        params: DeviceIdParam,
        response: { 200: DeviceResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
