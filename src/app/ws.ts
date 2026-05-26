import { io, Socket } from 'socket.io-client'

let sharedSocket: Socket | null = null

const createSocket = (): Socket => {
    const socket = io(process.env.SOCKET_SERVER_URL ?? '', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        auth: {
            token: process.env.INTERNAL_SOCKET_TOKEN ?? '',
            type: 'internal',
        },
    })

    socket.on('connect', () => {
        console.log('[internal socket] connected:', socket.id)
    })

    socket.on('disconnect', reason => {
        console.log('[internal socket] disconnected:', reason)
    })

    socket.on('connect_error', err => {
        console.error('[internal socket] connect error:', err.message)
    })

    return socket
}

const getInternalSocket = (): Socket => {
    if (!sharedSocket) {
        sharedSocket = createSocket()
    }

    return sharedSocket
}

export const emitEvent = (params: {
    targetId: string
    event: string
    data: Record<string, unknown>
}) => {
    const socket = getInternalSocket()

    if (!socket.connected) {
        console.warn(`[internal socket] skip emit ${params.event}`)
        return
    }

    socket.emit(params.event, {
        targetId: params.targetId,
        data: params.data,
    })
}
