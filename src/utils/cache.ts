import { redis } from '../datasource/redis.js'
import crypto from 'crypto'

export function cacheKey(prefix: string, payload: unknown) {
    const hash = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex')

    return `${prefix}:${hash}`
}

export async function getCache<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null

    return JSON.parse(value) as T
}

export async function setCache(key: string, value: unknown, ttlSeconds = 60) {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export async function delCache(key: string) {
    await redis.del(key)
}

export async function delCacheByPattern(pattern: string) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
        await redis.del(...keys)
    }
}

type CacheQueryOptions<T> = {
    prefix: string
    query: unknown
    ttl?: number
    queryFn: () => Promise<T>
}

export async function cacheQuery<T>({
    prefix,
    query,
    ttl,
    queryFn,
}: CacheQueryOptions<T>): Promise<T> {
    const key = cacheKey(prefix, query)

    const cached = await getCache<T>(key)

    if (cached) {
        return cached
    }

    const data = await queryFn()

    void setCache(key, data, ttl)

    return data
}
