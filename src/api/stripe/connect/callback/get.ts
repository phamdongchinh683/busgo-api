import { api, endpoint, tags } from '../../../../app/api.js'

const __filename = new URL('', import.meta.url).pathname

api.route({
    ...endpoint(__filename),

    handler: async (_request, reply) => {
        const redirectUrl = new URL(process.env.STRIPE_CLIENT_RETURN_URL ?? '')
        redirectUrl.searchParams.set('status', 'success')
        redirectUrl.searchParams.set('provider', 'stripe')
        return reply.redirect(redirectUrl.toString())
    },

    schema: {
        tags: tags(__filename),
    },
})
