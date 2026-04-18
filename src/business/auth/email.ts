import { dal } from '../../database/index.js'
import { Email, Otp, Phone } from '../../model/common.js'
import { service } from '../../service/index.js'
import { utils } from '../../utils/index.js'

export async function sendOtp(params: { field: 'email' | 'phone'; value: string }) {
    const { field, value } = params
    const otp = utils.random.generateRandomNumber(6)

    if (field === 'email') {
        return sendByEmail({ to: value, otp: otp.toString() })
    } else if (field === 'phone') {
        return sendByPhone({ to: value, otp: otp.toString() })
    }

    return {
        message: 'OK',
    }
}

async function sendByEmail(params: { to: Email; otp: Otp }) {
    const { to, otp } = params

    await dal.auth.userOtp.cmd.upsertOne({
        email: to,
        otp: otp,
        field: 'email',
        expiresAt: utils.time.getNow().add(2, 'minutes').toDate(),
    })

    if (process.env.APP_ENV === 'production') {
        await service.email.sender.send({
            from: 'noreply@bus-system.com',
            to: to,
            subject: 'OTP for reset password',
            text: `Your OTP is ${otp.toString()}`,
            html: `Your OTP is <b>${otp.toString()}</b>. This OTP will expire in 10 minutes.`,
        })
    }

    return {
        message: 'OK',
    }
}

async function sendByPhone(params: { to: Phone; otp: Otp }) {
    const { to, otp } = params

    await dal.auth.userOtp.cmd.upsertOne({
        phone: to,
        otp: otp,
        field: 'phone',
        expiresAt: utils.time.getNow().add(2, 'minutes').toDate(),
    })

    return {
        message: 'OK',
    }
}
