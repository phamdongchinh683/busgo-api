import { AUTH_USER_STATUS, AuthUserRole } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { requireVerifiedContacts } from './otp.js'

export async function register(body: AuthBody, role: AuthUserRole) {
    await requireVerifiedContacts(body.contactInfo)

    const data = {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.contactInfo.phone,
        email: body.contactInfo.email,
        password: utils.password.hashPassword(body.password),
        role,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: AUTH_USER_STATUS.active,
    }

    return dal.auth.user.cmd.signUp(data)
}
