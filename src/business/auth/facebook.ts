import { HttpErr } from '../../app/index.js'
import { dal } from '../../database/index.js'
import { AuthFacebookBody, AuthResponse } from '../../model/body/auth/index.js'
import { service } from '../../service/index.js'
import { createDecoder } from 'fast-jwt'
import { utils } from '../../utils/index.js'
import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { FacebookIdTokenPayload } from '../../service/facebook/type.js'
import { buildAuthResponse } from './session.js'

interface FacebookUserData {
    email?: null | string
    facebookId?: null | string
    firstName?: null | string
    lastName?: null | string
}

const decoder = createDecoder()

export async function verifyToken(params: { payload: AuthFacebookBody }): Promise<AuthResponse> {
    const { payload } = params
    const userData = await getFacebookUserData({ payload })
    if (!userData.facebookId)
        throw new HttpErr.UnprocessableEntity(
            'Không tìm thấy mã định danh tài khoản Facebook.',
            'INVALID_FACEBOOK_ACCOUNT'
        )
    if (!userData.email)
        throw new HttpErr.UnprocessableEntity(
            'Không tìm thấy email. Vui lòng cấp quyền truy cập email trong Facebook Login.',
            'EMAIL_NOT_FOUND'
        )

    await dal.auth.user.cmd.authUpsertByEmail({
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

    const user = await dal.auth.user.query.getAuthUser({ email: userData.email })

    if (
        !user ||
        user.role === AuthUserRole.enum.super_admin ||
        user.status !== AuthUserStatus.enum.active
    ) {
        throw new HttpErr.NotFound('Không tìm thấy người dùng hoặc tài khoản chưa được kích hoạt.')
    }

    return buildAuthResponse(user)
}

async function getFacebookUserData(params: {
    payload: AuthFacebookBody
}): Promise<FacebookUserData> {
    const { payload } = params
    const { accessToken, idToken } = payload

    if (accessToken) {
        const info = await service.facebook.verifyToken({ token: accessToken })
        return {
            email: info.email,
            facebookId: info.id,
            firstName: info.first_name,
            lastName: info.last_name,
        }
    }
    if (idToken) {
        const info = FacebookIdTokenPayload.parse(decoder(idToken))
        return {
            email: info.email,
            facebookId: info.sub,
            firstName: info.given_name,
            lastName: info.family_name,
        }
    }

    throw new HttpErr.UnprocessableEntity(
        'Vui lòng cung cấp idToken hoặc accessToken.',
        'TOKEN_INVALID'
    )
}
