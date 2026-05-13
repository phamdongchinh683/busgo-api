import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { auth } from '../../../../app/jwt/index.js'
import { bus } from '../../../../business/index.js'
import { DevicesResponse } from '../../../../model/body/device/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await auth.requiredAuthenticate(request.headers)
        return bus.auth.device.getAllDevices(userInfo.id)
    },

    schema: {
        response: { 200: DevicesResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
