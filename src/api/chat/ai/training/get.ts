import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { AiTrainingTextStatusResponse } from '../../../../model/body/chat/index.js'
import { service } from '../../../../service/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])

        return service.openai.getTrainingTextStatus()
    },
    schema: {
        response: { 200: AiTrainingTextStatusResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
