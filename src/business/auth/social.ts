import { jwt } from '../../app/index.js'
import { AUTH_USER_STATUS, AuthUserRole } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import type { AuthUserTableSelect } from '../../database/auth/user/table.js'
import type { AuthResponse } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'

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

export async function signInByGoogle(
    userData: GoogleSignInUser,
    role: AuthUserRole
): Promise<AuthResponse> {
    const user = await dal.auth.user.cmd.authUpsertByGoogleEmail({
        data: {
            email: userData.email,
            googleId: userData.googleId,
            password: utils.password.hashPassword(utils.random.generateRandomNumber(20)),
            firstName: userData.firstName ?? '',
            lastName: userData.lastName ?? '',
            isEmailVerified: userData.isEmailVerified ?? false,
            role: role,
            status: AUTH_USER_STATUS.active,
        },
    })

    return {
        message: 'Thành công',
        token: jwt.auth.generateToken(user),
        user: user,
    }
}

export async function signInByFacebook(
    userData: FacebookSignInUser,
    role: AuthUserRole
): Promise<AuthResponse> {
    let user: AuthUserTableSelect

    if (!userData.email) {
        user = await dal.auth.user.cmd.authUpsertByFacebookId({
            data: {
                email: null,
                facebookId: userData.facebookId,
                password: utils.password.hashPassword(utils.random.generateRandomNumber(20)),
                firstName: userData.firstName ?? '',
                lastName: userData.lastName ?? '',
                isEmailVerified: false,
                role: role,
                status: AUTH_USER_STATUS.active,
            },
        })
    } else {
        user = await dal.auth.user.cmd.authUpsertByFacebookEmail({
            data: {
                email: userData.email,
                facebookId: userData.facebookId,
                password: utils.password.hashPassword(utils.random.generateRandomNumber(20)),
                firstName: userData.firstName ?? '',
                lastName: userData.lastName ?? '',
                isEmailVerified: userData.isEmailVerified ?? Boolean(userData.email),
                role,
                status: AUTH_USER_STATUS.active,
            },
        })
    }

    return {
        message: 'Thành công',
        token: jwt.auth.generateToken(user),
        user: user,
    }
}
