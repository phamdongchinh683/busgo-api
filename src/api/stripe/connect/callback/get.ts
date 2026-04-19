import { api, endpoint, tags } from '../../../../app/api.js'
import { readFile } from 'fs/promises'
import path from 'path'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async (_request, reply) => {
        const filePath = path.join(process.cwd(), 'public', 'success.html')
        const html = await readFile(filePath, 'utf8')
        return reply.type('text/html; charset=utf-8').send(html)
    },

    schema: {
        tags: tags(__filename),
    },
})
