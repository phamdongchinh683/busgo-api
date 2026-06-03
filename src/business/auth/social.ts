import { HttpErr } from '../../app/index.js'
import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import type { AuthResponse } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { buildAuthResponse } from './session.js'

type AuthUser = NonNullable<Awaited<ReturnType<typeof dal.auth.user.query.getAuthUser>>>

interface SocialSignInUser {
    email: string
    firstName?: null | string
    isEmailVerified?: boolean
    lastName?: null | string
}

interface FacebookSignInUser {
    email?: null | string
    facebookId: string
    firstName?: null | string
    isEmailVerified?: boolean
    lastName?: null | string
}

export async function signInByEmail(userData: SocialSignInUser): Promise<AuthResponse> {
    const user = await dal.auth.user.cmd.authUpsertByEmail({
        data: {
            email: userData.email,
            password: utils.password.hashPassword(userData.email),
            fullName: getFullName(userData),
            phone: null,
            isPhoneVerified: false,
            isEmailVerified: userData.isEmailVerified ?? false,
            role: AuthUserRole.enum.customer,
            status: AuthUserStatus.enum.active,
        },
    })

    return buildSocialAuthResponse(user)
}

export async function signInByFacebook(userData: FacebookSignInUser): Promise<AuthResponse> {
    const user = await dal.auth.user.cmd.authUpsertByFacebook({
        data: {
            email: userData.email ?? null,
            facebookId: userData.facebookId,
            password: utils.password.hashPassword(userData.email ?? userData.facebookId),
            fullName: getFullName(userData),
            phone: null,
            isPhoneVerified: false,
            isEmailVerified: userData.isEmailVerified ?? Boolean(userData.email),
            role: AuthUserRole.enum.customer,
            status: AuthUserStatus.enum.active,
        },
    })

    return buildSocialAuthResponse(user)
}

function getFullName(userData: { firstName?: null | string; lastName?: null | string }) {
    return [userData.firstName, userData.lastName].filter(Boolean).join(' ').trim()
}

async function buildSocialAuthResponse(user: AuthUser): Promise<AuthResponse> {
    if (!canSignIn(user)) {
        throw new HttpErr.Forbidden('Tài khoản của bạn không có quyền đăng nhập vào ứng dụng.')
    }

    return buildAuthResponse(user)
}

function canSignIn(user: { role: AuthUserRole; status: AuthUserStatus }) {
    return user.role !== AuthUserRole.enum.super_admin && user.status === AuthUserStatus.enum.active
}
