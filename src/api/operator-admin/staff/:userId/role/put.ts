import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { jwt } from '../../../../../app/index.js'
import { AuthOperatorRole, OPERATOR_FEATURE_ROLES } from '../../../../../database/auth/user/type.js'
import { UserIdParam } from '../../../../../model/params/user/index.js'
import { StaffRoleResponse } from '../../../../../model/body/profile/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(
            request.headers,
            OPERATOR_FEATURE_ROLES.administration
        )
        const userId = await bus.publicId.resolve('user', request.params.id)
        return bus.auth.profile.updateStaffRole(userId, request.body, userInfo.companyId)
    },

    schema: {
        params: UserIdParam,
        body: AuthOperatorRole,
        response: { 200: StaffRoleResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
