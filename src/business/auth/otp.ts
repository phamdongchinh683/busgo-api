import { dal } from '../../database/index.js'
import { Email, Otp, Phone } from '../../model/common.js'
import { service } from '../../service/index.js'
import { utils } from '../../utils/index.js'

export async function send(params: { field: 'email' | 'phone'; value: string }) {
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

    await service.email.sender.send({
        to: to,
        subject: 'Bus Go OTP Code',
        html: service.email.template.otpTemplate({ otp: otp.toString() }),
    })

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

    await service.infobip.sender.send({
        to: to,
        message: `Your OTP code is ${otp.toString()}. This OTP will expire in 2 minutes.`,
    })

    return {
        message: 'OK',
    }
}
