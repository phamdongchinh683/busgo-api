import { HttpErr } from '../../app/index.js'
import { dal } from '../../database/index.js'
import { service } from '../../service/index.js'
import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { auth } from '../../app/jwt/index.js'
import { AuthGoogleBody, AuthResponse } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'

export async function verifyToken(params: { payload: AuthGoogleBody }): Promise<AuthResponse> {
    const {
        payload: { idToken },
    } = params

    const info = await service.google.verifyToken({ idToken })

    if (!info.email) throw new HttpErr.UnprocessableEntity('Email not found', 'EMAIL_NOT_FOUND')

    await dal.auth.user.cmd.authUpsertByEmail({
        data: {
            email: info.email,
            username: 'google_' + utils.random.generateRandomNumber(6).toString(),
            password: utils.password.hashPassword(info.email),
            fullName: [info.given_name, info.family_name].filter(Boolean).join(' ').trim(),
            phone: utils.random.generateRandomNumber(10).toString(),
            role: AuthUserRole.enum.customer,
            status: AuthUserStatus.enum.active,
        },
    })

    const user = await dal.auth.user.query.getOne({ email: info.email })

    if (!user) {
        throw new HttpErr.NotFound('User not found after Google sign-in')
    }

    return {
        message: 'OK',
        token: auth.generateToken({
            ...user,
            tokenVersion: user.tokenVersion,
        }),
        user,
    }
}
