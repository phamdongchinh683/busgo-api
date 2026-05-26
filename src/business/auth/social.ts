import { HttpErr } from '../../app/index.js'
import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import type { AuthResponse } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { buildAuthResponse } from './session.js'

interface SocialSignInUser {
    email: string
    firstName?: null | string
    lastName?: null | string
}

const notFoundMessage = 'Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt.'

export async function signInByEmail(userData: SocialSignInUser): Promise<AuthResponse> {
    const user = await dal.auth.user.cmd.authUpsertByEmail({
        data: {
            email: userData.email,
            password: utils.password.hashPassword(userData.email),
            fullName: [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim(),
            phone: null,
            isPhoneVerified: false,
            role: AuthUserRole.enum.customer,
            status: AuthUserStatus.enum.active,
        },
    })

    if (!canSignIn(user)) {
        throw new HttpErr.NotFound(notFoundMessage)
    }

    if (user.role === AuthUserRole.enum.customer) {
        return buildAuthResponse(user)
    }

    const authUser = await dal.auth.user.query.getAuthUser({ email: user.email })

    if (!authUser || !canSignIn(authUser)) {
        throw new HttpErr.NotFound(notFoundMessage)
    }

    return buildAuthResponse(authUser)
}

function canSignIn(user: { role: AuthUserRole; status: AuthUserStatus }) {
    return user.role !== AuthUserRole.enum.super_admin && user.status === AuthUserStatus.enum.active
}
