import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { requireVerifiedContacts } from './otp.js'

export async function register(body: AuthBody, role: AuthUserRole) {
    await requireVerifiedContacts(body.contactInfo)

    const data = {
        fullName: body.fullName,
        ...utils.common.parseContactInfo(body.contactInfo),
        password: utils.password.hashPassword(body.password),
        role,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: AuthUserStatus.enum.active,
    }

    return dal.auth.user.cmd.signUp(data)
}
