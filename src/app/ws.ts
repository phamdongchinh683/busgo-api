import { io, Socket } from 'socket.io-client'
import { AuthUserId } from '../database/auth/user/type.js'

const socketCache = new Map<AuthUserId, Socket>()
const ttlTimers = new Map<AuthUserId, ReturnType<typeof setTimeout>>()

const SOCKET_CACHE_TTL_MS = 60_000

const refreshTtl = (userId: AuthUserId) => {
    const old = ttlTimers.get(userId)
    if (old) clearTimeout(old)

    const timer = setTimeout(() => {
        const socket = socketCache.get(userId)
        socket?.disconnect()

        socketCache.delete(userId)
        ttlTimers.delete(userId)
    }, SOCKET_CACHE_TTL_MS)

    ttlTimers.set(userId, timer)
}

export const client = (params: { token: string; userId: AuthUserId }) => {
    const { token, userId } = params
    const normalizedToken = token.replace(/^Bearer\s+/i, '').trim()
    const url = (process.env.SOCKET_SERVER_URL ?? '').trim()
    if (!url || !normalizedToken) return null

    let socket = socketCache.get(userId)

    if (!socket) {
        socket = io(url, {
            transports: ['websocket'],
            reconnection: true,
            auth: { token: normalizedToken },
        })

        socket.on('disconnect', () => {
            socketCache.delete(userId)
            const t = ttlTimers.get(userId)
            if (t) clearTimeout(t)
            ttlTimers.delete(userId)
        })

        socket.onAny(() => {
            refreshTtl(userId)
        })

        socket.on('connect', () => {
            refreshTtl(userId)
        })
        socket.on('connect_error', err => {
            socketCache.delete(userId)
        })

        socketCache.set(userId, socket)
    } else {
        socket.auth = { token: normalizedToken }
        socket.connect()
    }

    refreshTtl(userId)

    return socket
}
