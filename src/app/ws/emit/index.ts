type SocketEventPayload = {
    targetId: string
    event: string
    data: Record<string, unknown>
}

export async function emitEvent(params: SocketEventPayload) {
    const url = process.env.UPSTASH_REDIS_REST_URL ?? ''
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

    const payload = JSON.stringify({
        targetId: params.targetId,
        event: params.event,
        data: params.data,
    })

    return await fetch(`${url}/publish/socket:events/${encodeURIComponent(payload)}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
}
