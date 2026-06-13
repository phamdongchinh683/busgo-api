import { api, endpoint, bearer, tags } from '../../../app/api.js'
import { jwt } from '../../../app/index.js'
import { bus } from '../../../business/index.js'
import { AuthUserRole } from '../../../database/auth/user/type.js'
import { BookingRequestBody, BookingResponse } from '../../../model/body/booking/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        return bus.booking.booking.initBooking(request.body, userInfo.id)
    },

    schema: {
        body: BookingRequestBody,
        response: { 200: BookingResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
