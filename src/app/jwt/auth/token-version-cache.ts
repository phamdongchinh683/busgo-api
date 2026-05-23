import { utils } from '../../../utils/index.js'

const TTL_SECONDS = 60

function tokenVersionKey(userId: string) {
    return `auth:token-version:${userId}`
}

export async function getCachedTokenVersion(userId: string) {
    return utils.cache.getCache<number>(tokenVersionKey(userId))
}

export async function setCachedTokenVersion(userId: string, tokenVersion: number) {
    await utils.cache.setCache(tokenVersionKey(userId), tokenVersion, TTL_SECONDS)
}

export async function deleteCachedTokenVersion(userId: string) {
    await utils.cache.delCache(tokenVersionKey(userId))
}
