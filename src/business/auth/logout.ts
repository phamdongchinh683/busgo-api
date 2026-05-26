import { dal } from '../../database/index.js'
import { UserInfo } from '../../model/common.js'

export async function updateTokenVersion(userInfo: UserInfo) {
    await dal.auth.user.cmd.incrementTokenVersion(userInfo.id)

    return {
        message: 'Thành công.',
    }
}
