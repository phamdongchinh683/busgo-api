import { redis } from '../../../datasource/redis.js'

export type SocketEventPayload = {
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

    try {
        return await redis.publish('socket:events', payload)
    } catch (err) {
        console.error('[emitEvent] redis publish failed', {
            channel: 'socket:events',
            targetId: params.targetId,
            event: params.event,
            error: err instanceof Error ? err.message : String(err),
        })
        return 0
    }
}
