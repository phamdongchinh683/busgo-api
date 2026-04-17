// import { api, endpoint, bearer, tags } from '../../../../app/api.js'
// import { requireRoles } from '../../../../app/jwt/handler.js'
// import { bus } from '../../../../business/index.js'
// import { AuthUserRole } from '../../../../database/auth/user/type.js'
// import { StripeBankAccountResponse } from '../../../../model/body/payment/index.js'
// import z from 'zod'

// const __filename = new URL('', import.meta.url).pathname

// api.route({
//     ...endpoint(__filename),

//     handler: async request => {
//         // const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.customer])
//         return await bus.payment.payment.linkStripeBankAccount(request.body.accountId)
//     },
//     schema: {
//         body: z.object({
//             accountId: z.string(),
//         }),
//         response: { 200: StripeBankAccountResponse },
//         tags: tags(__filename),
//     },
// })
