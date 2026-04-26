import { api, endpoint, bearer, tags } from '../../../../../app/api.js'
import { auth } from '../../../../../app/jwt/index.js'
import { AuthUserRole } from '../../../../../database/auth/user/type.js'
import { PresignedImageUploadResponse } from '../../../../../model/body/cloudinary/index.js'
import { service } from '../../../../../service/index.js'
import { PresignedImageUploadQuery } from '../../../../../model/query/presign/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    config: {
        rateLimit: {
            max: 20,
            timeWindow: '1m',
        },
    },
    handler: async request => {
        const userInfo = await auth.requireRoles(request.headers, [AuthUserRole.enum.super_admin])

        const { folder, id } = request.query
        return service.cloudinary.presigned.presignedUpload(folder, id)
    },
    schema: {
        querystring: PresignedImageUploadQuery,
        response: { 200: PresignedImageUploadResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
