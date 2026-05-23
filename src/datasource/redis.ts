import { Redis } from 'ioredis'

export const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB || 0),

    maxRetriesPerRequest: 3,

    enableReadyCheck: true,

    lazyConnect: true,

    connectTimeout: 10000,

    retryStrategy(times) {
        return Math.min(times * 200, 3000)
    },
})

redis.on('error', err => {
    console.error('Redis error:', err)
})
