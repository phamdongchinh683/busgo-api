import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import {
    AuthCompanyAdminSignUpRequestBody,
    AuthCompanyAdminSignUpResponse,
} from '../../../model/body/auth/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const companyId = await bus.publicId.resolve('busCompany', request.body.companyId)
        return bus.auth.adminRegister.registerCompanyAdmin({
            ...request.body,
            companyId,
        })
    },

    schema: {
        body: AuthCompanyAdminSignUpRequestBody,
        response: { 200: AuthCompanyAdminSignUpResponse },
        tags: tags(__filename),
    },
})
