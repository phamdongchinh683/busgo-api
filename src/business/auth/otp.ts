import { dal } from '../../database/index.js'
import { ContactInfo, Email, Otp, Phone } from '../../model/common.js'
import { service } from '../../service/index.js'
import { utils } from '../../utils/index.js'
import { HttpErr } from '../../app/index.js'
import { ProfileUpdateContactBody } from '../../model/body/profile/index.js'

export async function send(params: { field: 'email' | 'phone'; value: string }) {
    const { field, value } = params

    const otp = utils.random.generateRandomNumber(6)

    if (field === 'email') {
        return sendByEmail({ to: value, otp: otp.toString() })
    } else if (field === 'phone') {
        return sendByPhone({ to: value, otp: otp.toString() })
    }

    return {
        message: 'Thành công',
    }
}

async function sendByEmail(params: { to: Email; otp: Otp }) {
    const { to, otp } = params

    await dal.auth.userOtp.cmd.upsertOne({
        email: to,
        otp: otp,
        field: 'email',
        verified: false,
        expiresAt: utils.time.getNow().add(2, 'minutes').toDate(),
    })

    if (process.env.APP_ENV !== 'production') {
        return {
            message: 'Thành công',
        }
    }

    await service.email.sender.send({
        to: to,
        subject: 'BusGo - Mã OTP',
        html: service.email.template.otpTemplate({ otp: otp.toString() }),
    })

    return {
        message: 'Thành công',
    }
}

async function sendByPhone(params: { to: Phone; otp: Otp }) {
    const { to, otp } = params

    await dal.auth.userOtp.cmd.upsertOne({
        phone: to,
        otp: otp,
        field: 'phone',
        verified: false,
        expiresAt: utils.time.getNow().add(2, 'minutes').toDate(),
    })

    if (process.env.APP_ENV !== 'production') {
        return {
            message: 'Thành công',
        }
    }

    await service.sms.sender.send({
        to: to,
        message: `Mã OTP của bạn là ${otp.toString()}. Mã này sẽ hết hạn sau 2 phút.`,
    })

    return {
        message: 'Thành công',
    }
}

export function isDevelopmentOtp(otp: Otp): boolean {
    return process.env.APP_ENV !== 'production' && otp === '555555'
}

export async function verifyOtp(params: ProfileUpdateContactBody) {
    const verifiedOtp = await dal.auth.userOtp.cmd.verifyOne({
        field: params.field,
        value: params.value,
        otp: isDevelopmentOtp(params.otp) ? undefined : params.otp,
    })

    if (!verifiedOtp) {
        throw new HttpErr.Unauthorized('Mã OTP không hợp lệ hoặc đã hết hạn.')
    }
}

export async function verify(params: ProfileUpdateContactBody) {
    await verifyOtp(params)

    return {
        message: 'Thành công',
    }
}

export async function requireVerifiedContacts(contactInfo: ContactInfo) {
    const [emailOtp, phoneOtp] = await Promise.all([
        dal.auth.userOtp.cmd.findVerified({
            field: 'email',
            value: contactInfo.email,
        }),
        dal.auth.userOtp.cmd.findVerified({
            field: 'phone',
            value: contactInfo.phone,
        }),
    ])

    if (!emailOtp) {
        throw new HttpErr.UnprocessableEntity('Email chưa được xác thực.', 'EMAIL_NOT_VERIFIED')
    }

    if (!phoneOtp) {
        throw new HttpErr.UnprocessableEntity(
            'Số điện thoại chưa được xác thực.',
            'PHONE_NOT_VERIFIED'
        )
    }
}
