import { AuthUserRole, AuthUserStatus } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthCompanyAdminSignUpBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { AuthStaffProfileRole } from '../../database/auth/staff_profile/type.js'

export async function register(params: AuthCompanyAdminSignUpBody, role: AuthStaffProfileRole) {
    const data = {
        ...params,
        password: utils.password.hashPassword(params.password),
        status: AuthUserStatus.enum.inactive,
        role: AuthUserRole.enum.operator,
    }
    return dal.auth.user.cmd.signUpCompanyAdminWithCompany(data, role, params.companyId)
}

export async function registerCompanyAdmin(params: AuthCompanyAdminSignUpBody) {
    const data = {
        ...params,
        password: utils.password.hashPassword(params.password),
        status: AuthUserStatus.enum.inactive,
        role: AuthUserRole.enum.operator,
    }
    return dal.auth.user.cmd.signUpCompanyAdmin(data, AuthStaffProfileRole.enum.company_admin)
}
