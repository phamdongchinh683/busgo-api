import { api, endpoint, tags, bearer } from '../../../../../app/api.js'
import { bus } from '../../../../../business/index.js'
import { requireStaffProfileRole } from '../../../../../app/jwt/handler.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { UserIdParam } from '../../../../../model/params/user/index.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { ProfileUpdateBody, StaffRoleResponse } from '../../../../../model/body/profile/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return bus.auth.profile.updateStaffRole(request.params.userId, request.body)
    },

    schema: {
        params: UserIdParam,
        body: AuthStaffProfileRole,
        response: { 200: StaffRoleResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
