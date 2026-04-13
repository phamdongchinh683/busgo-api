import { AuthUserId } from '../../database/auth/user/type.js'
import { AuthUserDeviceId } from '../../database/auth/user_device/type.js'
import { dal } from '../../database/index.js'

export async function addDevice({ userId, fcmToken }: { userId: AuthUserId; fcmToken: string }) {
    return await dal.auth.userDevice.cmd.insertOne({
        userId,
        fcmToken,
    })
}

export async function removeDevice(id: AuthUserDeviceId) {
    return await dal.auth.userDevice.cmd.deleteOne(id)
}

export async function getAllDevices(userId: AuthUserId) {
    return await dal.auth.userDevice.query.findAllByUserId(userId)
}
