import { DriverSignUpBody } from '../../../model/body/auth/index.js'
import { MessageResponse } from '../../../model/common.js'
import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const { companyId, ...body } = request.body
        return bus.auth.driver.register(body, AuthUserRole.enum.driver, companyId)
    },

    schema: {
        body: DriverSignUpBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
    },
})
