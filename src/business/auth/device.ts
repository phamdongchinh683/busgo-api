import { AuthUserId } from '../../database/auth/user/type.js'
import { AuthUserDeviceId } from '../../database/auth/user_device/type.js'
import { dal } from '../../database/index.js'
import { utils } from '../../utils/index.js'
import { DevicesResponse } from '../../model/body/device/index.js'

const USER_DEVICES_CACHE_VERSION = 'v2'

function userDevicesCacheKey(userId: AuthUserId) {
    return `user_devices:${USER_DEVICES_CACHE_VERSION}:${userId}`
}

export async function addDevice(params: { userId: AuthUserId; fcmToken: string }) {
    const device = await dal.auth.userDevice.cmd.insertOne({
        userId: params.userId,
        fcmToken: params.fcmToken,
    })

    await utils.cache.delCache(userDevicesCacheKey(params.userId))

    return device
}

export async function removeDevice(id: AuthUserDeviceId, userId: AuthUserId) {
    const device = await dal.auth.userDevice.cmd.deleteOne(id)
    await utils.cache.delCache(userDevicesCacheKey(userId))
    return device
}

export async function getAllDevices(userId: AuthUserId) {
    const cacheKey = userDevicesCacheKey(userId)
    const cached = await utils.cache.getCache<DevicesResponse>(cacheKey)

    if (cached !== null) {
        return cached
    }

    const devices = await dal.auth.userDevice.query.findAllByUserId(userId)

    await utils.cache.setCache(cacheKey, devices, 3600)

    return devices
}
