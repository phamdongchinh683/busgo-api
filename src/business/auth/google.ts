import { HttpErr } from '../../app/index.js'
import { service } from '../../service/index.js'
import { AuthGoogleBody, AuthResponse } from '../../model/body/auth/index.js'
import { signInByEmail } from './social.js'

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

    return signInByEmail({
        email: info.email,
        firstName: info.given_name,
        isEmailVerified: info.email_verified === 'true',
        lastName: info.family_name,
    })
}
