import { api, bearer, endpoint, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { bus } from '../../../../../business/index.js'
import { DeviceResponse } from '../../../../../model/body/device/index.js'
import { DeviceIdParam } from '../../../../../model/params/device/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requiredAuthenticate(request.headers)
        const { id } = request.params
        return bus.auth.device.removeDevice(request.params.id, userInfo.id)
    },

    schema: {
        params: DeviceIdParam,
        response: { 200: DeviceResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
