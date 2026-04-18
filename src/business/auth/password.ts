import { dal } from '../../database/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { HttpErr } from '../../app/index.js'
import { utils } from '../../utils/index.js'
import { AuthPassword } from '../../model/body/auth/index.js'
import { Email, Otp, Phone } from '../../model/common.js'

export async function updatePassword(
    id: AuthUserId,
    params: {
        oldPassword: AuthPassword
        newPassword: AuthPassword
    }
) {
    const user = await dal.auth.user.query.getOne({ id })
    if (!user) {
        throw new HttpErr.NotFound('USER_NOT_FOUND')
    }

    const verify = utils.password.verifyPassword(params.oldPassword, user.password)

    if (!verify) {
        throw new HttpErr.Unauthorized('Incorrect password.')
    }

    await dal.auth.user.cmd.updatePassword({
        password: params.newPassword,
    })

    return {
        message: 'OK',
    }
}

export async function resetPassword(params: { otp: Otp; email?: Email; phone?: Phone; password: AuthPassword }) {
    const { otp, email, phone, password } = params

    const user = await dal.auth.userOtp.cmd.getOne({ otp, email, phone })
    const now = utils.time.getNow().toDate()

    if (!user || (user.expiresAt && user.expiresAt < now))
        throw new HttpErr.Unauthorized('Invalid or expired OTP.')

    if (email && !phone) {
        await dal.auth.user.cmd.updatePassword({
            password: password,
            email: email,
        })

        await dal.auth.userOtp.cmd.upsertOne({
            otp: "",
            email: email,
            field: 'email',
        })
    }
    if (phone && !email) {
        await dal.auth.user.cmd.updatePassword({
            password: password,
            phone: phone,
        })

        await dal.auth.userOtp.cmd.upsertOne({
            otp: "",
            phone: phone,
            field: 'phone',
        })
    }

    return {
        message: 'OK',
    }

}
