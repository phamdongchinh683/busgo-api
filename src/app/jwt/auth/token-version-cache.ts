import type { AuthUserId } from '../../../database/auth/user/type.js'

type CacheEntry = {
    expiresAt: number
    tokenVersion: number
}

const cache = new Map<AuthUserId, CacheEntry>()

const cacheTtlMs = Number(60_000)
const cacheEnabled = Number.isFinite(cacheTtlMs) && cacheTtlMs > 0

export function getTokenVersion(userId: AuthUserId): number | undefined {
    if (!cacheEnabled) return undefined

    const entry = cache.get(userId)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
        cache.delete(userId)
        return undefined
    }

    return entry.tokenVersion
}

export function rememberTokenVersion(userId: AuthUserId, tokenVersion: number) {
    if (!cacheEnabled) return

    cache.set(userId, {
        tokenVersion,
        expiresAt: Date.now() + cacheTtlMs,
    })
}

export function forgetTokenVersion(userId: AuthUserId) {
    cache.delete(userId)
}
