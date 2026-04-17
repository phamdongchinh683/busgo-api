// import { api, endpoint, bearer, tags } from '../../../../app/api.js'
// import { requireRoles } from '../../../../app/jwt/handler.js'
// import { bus } from '../../../../business/index.js'
// import { AuthUserRole } from '../../../../database/auth/user/type.js'
// import { StripeBankAccountResponse } from '../../../../model/body/payment/index.js'

// const __filename = new URL('', import.meta.url).pathname

// api.route({
//     ...endpoint(__filename),

//     handler: async request => {
//         // const userInfo = await requireRoles(request.headers, [AuthUserRole.enum.customer])
//         return await bus.payment.payment.createStripePayment(1)
//     },
//     schema: {
//         response: { 200: StripeBankAccountResponse },
//         tags: tags(__filename),
//     },
// })
