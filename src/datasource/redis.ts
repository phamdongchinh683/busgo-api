import { Redis, type RedisOptions } from 'ioredis'

const isProduction = process.env.APP_ENV === 'production'

const redisUrl = process.env.REDIS_URL ?? ''

const redisOptions: RedisOptions = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    connectTimeout: isProduction ? 10000 : 5000,
    commandTimeout: isProduction ? 5000 : 3000,
    retryStrategy(times) {
        return Math.min(times * 150, 3000)
    },
    keepAlive: 30000,
}

export const redis = new Redis(redisUrl, redisOptions)
