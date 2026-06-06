import { HttpErr } from '../../app/index.js'
import { dal } from '../../database/index.js'

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
