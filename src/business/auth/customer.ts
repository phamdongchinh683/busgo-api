import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'

export async function register(body: AuthBody, role: AuthUserRole) {
    const data = {
        fullName: body.fullName,
        ...utils.common.parseContactInfo(body.contactInfo),
        password: utils.password.hashPassword(body.password),
        role,
        status: AuthUserStatus.enum.active,
    }

    return dal.auth.user.cmd.signUp(data)
}
