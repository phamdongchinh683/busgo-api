import { Redis, type RedisOptions } from 'ioredis'

const redisOptions: RedisOptions = {
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    lazyConnect: false,
    connectTimeout: 3000,
    retryStrategy(times) {
        return Math.min(times * 100, 1000)
    },
    keepAlive: 10000,
}

export const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisOptions)
    : new Redis({
          ...redisOptions,
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT || 6379),
          password: process.env.REDIS_PASSWORD,
          db: Number(process.env.REDIS_DB || 0),
      })

redis.on('error', error => {
    console.error('Redis connection error', error)
})
