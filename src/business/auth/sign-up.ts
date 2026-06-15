import { HttpErr } from '../../app/index.js'
import { AUTH_USER_STATUS, AuthUserRole } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthCompanyAdminSignUpBody, DriverSignUpBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'
import { requireVerifiedContacts } from './otp.js'

export async function checkExist(params: { field: 'email' | 'phone'; value: string }) {
    const { field, value } = params
    const user = await dal.auth.user.query.findOneByEmailOrPhone({
        [field]: value,
    })

    if (user) throw new HttpErr.UnprocessableEntity('Thông tin đã tồn tại.', `${value} đã tồn tại.`)

    return {
        message: 'OK',
    }
}

export async function registerOperator(params: AuthCompanyAdminSignUpBody) {
    await requireVerifiedContacts(params.contactInfo)

    const data = {
        ...params,
        phone: params.contactInfo.phone,
        email: params.contactInfo.email,
        password: utils.password.hashPassword(params.password),
    }

    return dal.auth.user.cmd.createOneOperator(data, AuthUserRole.enum.operator)
}

export async function registerDriver(body: DriverSignUpBody) {
    await requireVerifiedContacts(body.contactInfo)

    const data = {
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.contactInfo.phone,
        email: body.contactInfo.email,
        password: utils.password.hashPassword(body.password),
        role: AuthUserRole.enum.driver,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: AUTH_USER_STATUS.active,
    }

    return dal.auth.user.cmd.insertDriver({
        data: data,
        companyId: body.companyId,
    })
}
