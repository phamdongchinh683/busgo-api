import { HttpErr } from '../../app/index.js'
import { AuthUserRole } from '../../database/auth/user/type.js'
import { dal } from '../../database/index.js'
import { AuthCompanyAdminSignUpBody } from '../../model/body/auth/index.js'
import { utils } from '../../utils/index.js'

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
    const data = {
        ...params,
        phone: params.contactInfo.phone,
        email: params.contactInfo.email,
        password: utils.password.hashPassword(params.password),
    }

    return dal.auth.user.cmd.createOneOperator(data, AuthUserRole.enum.operator)
}
