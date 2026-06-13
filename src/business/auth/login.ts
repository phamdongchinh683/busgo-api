import { HttpErr, jwt } from '../../app/index.js'
import { AUTH_USER_STATUS, AuthUserRole } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthSignInBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'

export async function byEmailOrPhone(params: AuthSignInBody) {
    return signIn(params, false)
}

export async function byEmailOrPhoneSuperAdmin(params: AuthSignInBody) {
    return signIn(params, true)
}

async function signIn(params: AuthSignInBody, isSuperAdminSignIn: boolean) {
    const user = await dal.auth.user.query.getOne({
        email: params.email,
        phone: params.phone,
    })

    const isSuperAdmin = user?.role === AuthUserRole.enum.super_admin

    if (!user || user.status !== AUTH_USER_STATUS.active || isSuperAdmin !== isSuperAdminSignIn) {
        throw new HttpErr.NotFound(
            user?.status === AUTH_USER_STATUS.inactive
                ? 'Tài khoản chưa được kích hoạt.'
                : 'Không tìm thấy người dùng.',
            {
                email: params.email,
                phone: params.phone,
                status: user?.status,
            },
            user?.status === AUTH_USER_STATUS.inactive ? 'USER_INACTIVE' : 'USER_NOT_FOUND',
            404
        )
    }

    const isValid = utils.password.verifyPassword(params.password, user.password)
    if (!isValid) {
        throw new HttpErr.Unauthorized('Mật khẩu không chính xác.')
    }

    return {
        message: 'Thành công',
        token: jwt.auth.generateToken(user),
        user: user,
    }
}
