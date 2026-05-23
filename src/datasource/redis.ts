import { Redis } from 'ioredis'

export const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',

    port: Number(process.env.REDIS_PORT || 6379),

    password: process.env.REDIS_PASSWORD,

    db: Number(process.env.REDIS_DB || 0),

    maxRetriesPerRequest: 1,

    enableReadyCheck: false,

    lazyConnect: false,

    connectTimeout: 3000,

    retryStrategy(times) {
        return Math.min(times * 100, 1000)
    },

    keepAlive: 10000,
})

redis.on('connect', () => {
    console.log({ redis: 'connected' })
})

redis.on('error', err => {
    console.error({ redis: 'error' }, err)
})
