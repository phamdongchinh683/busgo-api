import { redis } from '../../../datasource/redis.js'

type SocketEventPayload = {
    targetId: string
    event: string
    data: Record<string, unknown>
}

export async function emitEvent(params: SocketEventPayload): Promise<number> {
    const payload = JSON.stringify({
        targetId: params.targetId,
        event: params.event,
        data: params.data,
    })

    return redis.publish('socket:events', payload)
}
