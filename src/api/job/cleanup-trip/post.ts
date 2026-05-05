import { api, endpoint, tags } from '../../../app/api.js'
import { bus } from '../../../business/index.js'
import { MessageResponse } from '../../../model/common.js'
import { secret } from '../../../app/index.js'
const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        secret.cron.verifyCronSecret(request.headers['x-cron-secret'] as string)
        return bus.cron.cleanupTrip.cleanupTripWeekly()
    },
    schema: {
        response: { 200: MessageResponse },
        tags: tags(__filename),
    },
})
