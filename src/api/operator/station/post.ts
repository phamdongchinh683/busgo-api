import { api, endpoint, tags, bearer } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { jwt } from '../../../app/index.js'
import { OPERATOR_ROLES } from '../../../database/auth/user/type.js'
import { StationBody, StationUpsertResponse } from '../../../model/body/station/index.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async request => {
        const userInfo = await jwt.auth.requireRoles(request.headers, OPERATOR_ROLES)
        return bus.operation.station.createStation({
            body: request.body,
            companyId: userInfo.companyId,
        })
    },

    schema: {
        body: StationBody,
        response: { 200: StationUpsertResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
