import { HttpErr } from '../../app/index.js'
import { dal } from '../../database/index.js'
import { service } from '../../service/index.js'
import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { AuthGoogleBody, AuthResponse } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { buildAuthResponse } from './session.js'

export async function verifyToken(params: { payload: AuthGoogleBody }): Promise<AuthResponse> {
    const {
        payload: { idToken },
    } = params

    const info = await service.google.verifyToken({ idToken })

    if (!info.email)
        throw new HttpErr.UnprocessableEntity(
            'Không tìm thấy email từ tài khoản Google.',
            'EMAIL_NOT_FOUND'
        )

    const user = await dal.auth.user.cmd.authUpsertByEmail({
        data: {
            email: info.email,
            password: utils.password.hashPassword(info.email),
            fullName: [info.given_name, info.family_name].filter(Boolean).join(' ').trim(),
            phone: null,
            isPhoneVerified: false,
            role: AuthUserRole.enum.customer,
            status: AuthUserStatus.enum.active,
        },
    })

    if (user.role === AuthUserRole.enum.super_admin || user.status !== AuthUserStatus.enum.active) {
        throw new HttpErr.NotFound('Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt.')
    }

    if (user.role === AuthUserRole.enum.customer) {
        return buildAuthResponse(user)
    }

    const authUser = await dal.auth.user.query.getAuthUser({ email: user.email })

    if (
        !authUser ||
        authUser.role === AuthUserRole.enum.super_admin ||
        authUser.status !== AuthUserStatus.enum.active
    ) {
        throw new HttpErr.NotFound('Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt.')
    }

    return buildAuthResponse(authUser)
}
