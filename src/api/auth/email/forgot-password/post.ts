import { api, bearer, endpoint, tags } from '../../../../app/api.js'
import { requiredAuthenticate } from '../../../../app/jwt/handler.js'
import { bus } from '../../../../business/index.js'
import { AuthForgotPasswordBody } from '../../../../model/body/auth/index.js'
import { NotificationResponse } from '../../../../model/body/notification/index.js'
import { MessageResponse } from '../../../../model/common.js'
import { NotificationIdParam } from '../../../../model/params/notification/index.js'
import { service } from '../../../../service/index.js'
import { utils } from '../../../../utils/index.js'

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
        const password = utils.random.generateRandomNumber(10)
        await service.email.sender.sendMail({
            to: request.body.email,
            subject: 'Đặt lại mật khẩu',
            html: service.email.template.emailForgotPassword({ email: request.body.email, password: password.toString() }),
        })
        return {
            message: 'OK',
        }
    },
    schema: {
        body: AuthForgotPasswordBody,
        response: { 200: MessageResponse },
        tags: tags(__filename),
        security: bearer,
    },
})
