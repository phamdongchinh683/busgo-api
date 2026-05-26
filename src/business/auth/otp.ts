import { dal } from '../../database/index.js'
import { Email, Otp, Phone } from '../../model/common.js'
import { service } from '../../service/index.js'
import { utils } from '../../utils/index.js'

export async function send(params: { field: 'email' | 'phone'; value: string }) {
    const { field, value } = params

    const normalizedValue = field === 'email' ? value.trim().toLowerCase() : value.trim()
    const cacheKey = utils.cache.cacheKey(`otp:${field}`, normalizedValue)

    const cachedOtp = await utils.cache.getCache<Otp>(cacheKey)

    const otp = cachedOtp ?? utils.random.generateRandomNumber(6)

    if (!cachedOtp) {
        await utils.cache.setCache(cacheKey, otp, 120)
    }

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
        expiresAt: utils.time.getNow().add(2, 'minutes').toDate(),
    })

    if (process.env.APP_ENV !== 'production') {
        return {
            message: 'Thành công',
        }
    }

    await service.infobip.sender.send({
        to: to,
        message: `Mã OTP của bạn là ${otp.toString()}. Mã này sẽ hết hạn sau 2 phút.`,
    })

    return {
        message: 'Thành công',
    }
}
