import { api, endpoint, bearer, tags } from '../../../../app/api.js'
import { jwt } from '../../../../app/index.js'
import { bus } from '../../../../business/index.js'
import { AuthUserRole } from '../../../../database/auth/user/type.js'
import { TripPrepareResponse, TripRequestBody } from '../../../../model/body/trip/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        await jwt.auth.requireRoles(request.headers, [AuthUserRole.enum.customer])
        const [scheduleId, companyId] = await Promise.all([
            bus.publicId.resolve('tripSchedule', request.body.scheduleId),
            bus.publicId.resolve('busCompany', request.body.companyId),
        ])
        const trip = await bus.operation.trip.prepareTrip({
            ...request.body,
            scheduleId,
            companyId,
        })

        return {
            id: trip.id,
            companyId: request.body.companyId,
        }
    },

    schema: {
        body: TripRequestBody,
        response: { 200: TripPrepareResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
