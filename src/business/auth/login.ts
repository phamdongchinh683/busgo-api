import { HttpErr } from '../../app/index.js'
import { generateToken } from '../../app/jwt/handler.js'
import { AuthUserStatus } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthSignInBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'

export async function byUsernameEmailOrPhone(params: AuthSignInBody) {
    const user = await dal.auth.user.query.getOne({
        username: params.username,
        email: params.email,
        phone: params.phone,
    })
    if (!user || user.status !== AuthUserStatus.enum.active) {
        throw new HttpErr.NotFound(
            user?.status === AuthUserStatus.enum.inactive ? 'USER_INACTIVE' : 'USER_NOT_FOUND',
            {
                username: params.username,
                email: params.email,
                phone: params.phone,
                status: user?.status,
            },
            user?.status === AuthUserStatus.enum.inactive ? 'USER_INACTIVE' : 'USER_NOT_FOUND',
            404
        )
    }

    const isValid = utils.password.verifyPassword(params.password, user.password)
    if (!isValid) {
        throw new HttpErr.Unauthorized('Incorrect password.')
    }
    return {
        message: 'OK',
        token: generateToken({
            ...user,
            tokenVersion: user.tokenVersion,
        }),
        user,
    }
}
