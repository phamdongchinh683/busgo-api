import { AuthOperatorRole, AuthUserRole } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthCompanyAdminSignUpBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'

export async function register(params: AuthCompanyAdminSignUpBody, role: AuthOperatorRole) {
    const data = {
        ...params,
        password: utils.password.hashPassword(params.password),
    }
    return dal.auth.user.cmd.signUpCompanyAdminWithCompany(data, role, params.companyId)
}

export async function registerCompanyAdmin(params: AuthCompanyAdminSignUpBody) {
    const data = {
        ...params,
        password: utils.password.hashPassword(params.password),
    }
    return dal.auth.user.cmd.signUpCompanyAdmin(data, AuthUserRole.enum.operator_admin)
}
