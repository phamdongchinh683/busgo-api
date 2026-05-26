import { io, Socket } from 'socket.io-client'
let sharedSocket: Socket | null = null
let isConnecting = false

const createSocket = (): Socket => {
    const socket = io(process.env.SOCKET_SERVER_URL ?? '', {
        transports: ['websocket'],
        reconnection: false,
        auth: {
            token: process.env.INTERNAL_SOCKET_TOKEN ?? '',
            type: 'internal',
        },
    })

    socket.on('connect', () => {
        isConnecting = false
        console.log('[internal socket] connected:', socket.id)
    })

    socket.on('disconnect', reason => {
        isConnecting = false
        console.log('[internal socket] disconnected:', reason)
        sharedSocket = null
    })

    socket.on('connect_error', err => {
        isConnecting = false
        console.error('[internal socket] connect error:', err.message)
        sharedSocket = null
    })

    return socket
}

const getInternalSocket = (): Socket | null => {
    if (sharedSocket?.connected) return sharedSocket

    if (isConnecting && sharedSocket) return sharedSocket

    isConnecting = true
    sharedSocket = createSocket()
    return sharedSocket
}

export const emitEvent = (params: {
    targetId: string
    event: string
    data: Record<string, unknown>
}) => {
    const socket = getInternalSocket()
    if (!socket) {
        throw new Error('Socket not connected')
    }

    socket.emit(params.event, {
        targetId: params.targetId,
        data: params.data,
    })
}
