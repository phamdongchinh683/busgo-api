import { HttpErr } from '../../app/index.js'
import { AuthUserStatus } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthSignInBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { buildAuthResponse } from './session.js'

export async function byEmailOrPhone(params: AuthSignInBody) {
    const user = await dal.auth.user.query.getAuthUser({
        email: params.email,
        phone: params.phone,
    })
    if (!user || user.status !== AuthUserStatus.enum.active) {
        throw new HttpErr.NotFound(
            user?.status === AuthUserStatus.enum.inactive
                ? 'Tài khoản chưa được kích hoạt.'
                : 'Không tìm thấy người dùng.',
            {
                email: params.email,
                phone: params.phone,
                status: user?.status,
            },
            user?.status === AuthUserStatus.enum.inactive ? 'USER_INACTIVE' : 'USER_NOT_FOUND',
            404
        )
    }

    const isValid = utils.password.verifyPassword(params.password, user.password)
    if (!isValid) {
        throw new HttpErr.Unauthorized('Mật khẩu không chính xác.')
    }

    return buildAuthResponse(user)
}

export async function byEmailOrPhoneSuperAdmin(params: AuthSignInBody) {
    const user = await dal.auth.user.query.getAuthUser({
        email: params.email,
        phone: params.phone,
    })
    if (!user || user.status !== AuthUserStatus.enum.active || user.role !== 'super_admin') {
        throw new HttpErr.NotFound(
            user?.status === AuthUserStatus.enum.inactive
                ? 'Tài khoản chưa được kích hoạt.'
                : 'Không tìm thấy người dùng.',
            {
                email: params.email,
                phone: params.phone,
                status: user?.status,
            },
            user?.status === AuthUserStatus.enum.inactive ? 'USER_INACTIVE' : 'USER_NOT_FOUND',
            404
        )
    }

    const isValid = utils.password.verifyPassword(params.password, user.password)
    if (!isValid) {
        throw new HttpErr.Unauthorized('Mật khẩu không chính xác.')
    }

    return buildAuthResponse(user)
}
