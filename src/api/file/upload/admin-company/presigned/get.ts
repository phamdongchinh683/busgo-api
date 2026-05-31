import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { jwt } from '../../../../../app/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { AuthStaffProfileRole } from '../../../../../database/auth/staff_profile/type.js'
import { PresignedImageUploadResponse } from '../../../../../model/body/cloudinary/index.js'
import { service } from '../../../../../service/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireStaffProfileRole(
            request.headers,
            [AuthUserRole.enum.operator],
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
