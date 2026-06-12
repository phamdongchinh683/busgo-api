import { HttpErr } from '../../app/index.js'
import { AUTH_USER_STATUS, AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
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

interface GoogleSignInUser extends SocialSignInUser {
    googleId: string
}

interface FacebookSignInUser {
    email?: null | string
    facebookId: string
    firstName?: null | string
    isEmailVerified?: boolean
    lastName?: null | string
}

export async function signInByGoogle(userData: GoogleSignInUser): Promise<AuthResponse> {
    const user = await dal.auth.user.cmd.authUpsertByGoogleEmail({
        data: {
            email: userData.email,
            googleId: userData.googleId,
            password: utils.password.hashPassword(utils.random.generateRandomNumber(20)),
            fullName: getFullName(userData),
            isEmailVerified: userData.isEmailVerified ?? false,
            role: AuthUserRole.enum.customer,
            status: AUTH_USER_STATUS.active,
        },
    })

    return buildSocialAuthResponse(user)
}

export async function signInByFacebook(userData: FacebookSignInUser): Promise<AuthResponse> {
    if (!userData.email) {
        const user = await dal.auth.user.cmd.authUpsertByFacebookId({
            data: {
                email: null,
                facebookId: userData.facebookId,
                password: utils.password.hashPassword(utils.random.generateRandomNumber(20)),
                fullName: getFullName(userData),
                isEmailVerified: false,
                role: AuthUserRole.enum.customer,
                status: AUTH_USER_STATUS.active,
            },
        })

        return buildSocialAuthResponse(user)
    }

    const user = await dal.auth.user.cmd.authUpsertByFacebookEmail({
        data: {
            email: userData.email,
            facebookId: userData.facebookId,
            password: utils.password.hashPassword(utils.random.generateRandomNumber(20)),
            fullName: getFullName(userData),
            isEmailVerified: userData.isEmailVerified ?? Boolean(userData.email),
            role: AuthUserRole.enum.customer,
            status: AUTH_USER_STATUS.active,
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
    return user.role !== AuthUserRole.enum.super_admin && user.status === AUTH_USER_STATUS.active
}
