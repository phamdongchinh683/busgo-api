import { utils } from '../../../utils/index.js'

const TTL_SECONDS = 3600

function tokenVersionKey(userId: string | number) {
    return `auth:token-version:${userId}`
}

export async function getCachedTokenVersion(userId: string | number) {
    return utils.cache.getCache<number>(tokenVersionKey(userId))
}

export async function setCachedTokenVersion(userId: string | number, tokenVersion: number) {
    await utils.cache.setCache(tokenVersionKey(userId), tokenVersion, TTL_SECONDS)
}

export async function deleteCachedTokenVersion(userId: string | number) {
    await utils.cache.delCache(tokenVersionKey(userId))
}
