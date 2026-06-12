import { dal } from '../../database/index.js'
import { AuthUserId } from '../../database/auth/user/type.js'
import { HttpErr } from '../../app/index.js'
import { utils } from '../../utils/index.js'
import { AuthForgotPasswordBody, AuthPassword } from '../../model/body/auth/index.js'
import { verifyOtp } from './otp.js'

export async function updatePassword(
    id: AuthUserId,
    params: {
        oldPassword: AuthPassword
        newPassword: AuthPassword
    }
) {
    const user = await dal.auth.user.query.getOne({ id })
    if (!user) {
        throw new HttpErr.NotFound('Không tìm thấy người dùng.', {}, 'USER_NOT_FOUND')
    }

    const verify = utils.password.verifyPassword(params.oldPassword, user.password)

    if (!verify) {
        throw new HttpErr.Unauthorized('Mật khẩu hiện tại không chính xác.')
    }

    await dal.auth.user.cmd.updatePassword({
        password: params.newPassword,
    })

    return {
        message: 'Thành công',
    }
}

export async function resetPassword(params: AuthForgotPasswordBody) {
    const { otp, email, phone, password } = params

    const contact =
        email !== undefined
            ? { field: 'email' as const, value: email }
            : { field: 'phone' as const, value: phone }

    await verifyOtp({ ...contact, otp })
    await dal.auth.user.cmd.updatePassword({
        password,
        [contact.field]: contact.value,
    })

    return {
        message: 'Thành công',
    }
}
