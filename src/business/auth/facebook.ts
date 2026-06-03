import { HttpErr } from '../../app/index.js'
import { AuthFacebookBody, AuthResponse } from '../../model/body/auth/index.js'
import { service } from '../../service/index.js'
import { createDecoder } from 'fast-jwt'
import { FacebookIdTokenPayload } from '../../service/facebook/type.js'
import { signInByEmail } from './social.js'

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

    console.log('Facebook user data:', userData)
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

    return signInByEmail({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
    })
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
