import { api, endpoint, tags } from '../../../app/api.js'
import { HttpErr, secret } from '../../../app/index.js'
import { verifyCronSecret } from '../../../app/secret/cron/index.js'
import { bus } from '../../../business/index.js'
import { db } from '../../../datasource/db.js'
import { MessageResponse } from '../../../model/common.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),
    handler: async request => {
        secret.cron.verifyCronSecret(request.headers['x-cron-secret'] as string)
        return bus.cron.departureReminder.departureReminder()
    },
    schema: {
        response: { 200: MessageResponse },
        tags: tags(__filename),
    },
})
