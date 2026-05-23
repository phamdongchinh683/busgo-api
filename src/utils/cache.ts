import { redis } from '../datasource/redis.js'
import crypto from 'crypto'

function normalizePayload(value: unknown): unknown {
    if (typeof value === 'bigint') return value.toString()
    if (value === null || typeof value !== 'object') return value
    if (value instanceof Date) return value.toISOString()
    if (Array.isArray(value)) return value.map(normalizePayload)

    return Object.keys(value as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
            const item = (value as Record<string, unknown>)[key]
            if (item !== undefined) {
                acc[key] = normalizePayload(item)
            }
            return acc
        }, {})
}

function stringifyPayload(payload: unknown) {
    return JSON.stringify(normalizePayload(payload)) ?? 'undefined'
}

function logCacheError(operation: string, key: string, error: unknown) {
    console.error(`Redis cache ${operation} failed for ${key}`, error)
}

export function cacheKey(prefix: string, payload: unknown) {
    const hash = crypto.createHash('sha1').update(stringifyPayload(payload)).digest('hex')

    return `${prefix}:${hash}`
}

export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const value = await redis.get(key)
        if (!value) return null

        return JSON.parse(value) as T
    } catch (error) {
        logCacheError('get', key, error)
        return null
    }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 60) {
    try {
        const serialized = JSON.stringify(value)
        if (serialized === undefined) return

        await redis.set(key, serialized, 'EX', ttlSeconds)
    } catch (error) {
        logCacheError('set', key, error)
    }
}

export async function delCache(key: string) {
    try {
        await redis.del(key)
    } catch (error) {
        logCacheError('del', key, error)
    }
}

async function deleteKeys(keys: string[]) {
    if (keys.length === 0) return

    try {
        await redis.unlink(...keys)
    } catch {
        await redis.del(...keys)
    }
}

export async function delCacheByPattern(pattern: string, count = 100) {
    let cursor = '0'

    try {
        do {
            const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', count)
            cursor = nextCursor
            await deleteKeys(keys)
        } while (cursor !== '0')
    } catch (error) {
        logCacheError('del pattern', pattern, error)
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

    if (cached !== null) {
        return cached
    }

    const data = await queryFn()

    void setCache(key, data, ttl)

    return data
}
