import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { auth } from '../../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { PresignedImageUploadResponse } from '../../../../../model/body/cloudinary/index.js'
import { service } from '../../../../../service/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 60,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        const userInfo = await auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.admin],
            [AuthStaffProfileRole.enum.company_admin]
        )
        return service.cloudinary.presigned.presignedUpload('company', userInfo.companyId)
    },
    schema: {
        response: { 200: PresignedImageUploadResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
