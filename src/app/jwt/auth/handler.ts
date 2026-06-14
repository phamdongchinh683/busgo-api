import { createSigner, createVerifier } from 'fast-jwt'

import { Unauthorized } from '../../error-type.js'
import { HttpErr } from '../../index.js'
import { db } from '../../../datasource/db.js'
import { getCachedTokenVersion, setCachedTokenVersion } from './token-version-cache.js'
const sign = createSigner({
    algorithm: 'HS256',
    expiresIn: `30days`,
    key: process.env.JWT_SECRET,
})
const verify = createVerifier({ key: process.env.JWT_SECRET })

export const generateToken = (payload: any): string => {
    return sign(payload)
}

interface Headers {
    authorization?: string
    Authorization?: string
}

const verifyToken = async (headers: Headers) => {
    const authHeader = headers['authorization'] ?? headers['Authorization']
    if (!authHeader) return null

    const bearer = 'Bearer '
    const token = authHeader.startsWith(bearer) ? authHeader.slice(bearer.length) : authHeader

    let payload: any
    try {
        payload = verify(token)
    } catch (error) {
        throw new Unauthorized('Header xác thực không hợp lệ.')
    }

    if (!payload?.id || payload.tokenVersion === undefined) {
        throw new Unauthorized('Thông tin token không hợp lệ.')
    }

    const cachedTokenVersion = await getCachedTokenVersion(payload.id)
    if (cachedTokenVersion !== null) {
        if (cachedTokenVersion !== payload.tokenVersion) {
            throw new Unauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        }
        return payload
    }

    const user = await db
        .selectFrom('auth.user as u')
        .select(['u.id', 'u.tokenVersion'])
        .where('u.id', '=', payload.id)
        .executeTakeFirst()

    if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new Unauthorized('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }

    await setCachedTokenVersion(user.id, user.tokenVersion)

    return payload
}

export const requiredAuthenticate = async (headers: Headers): Promise<any> => {
    const userInfo = await verifyToken(headers)
    if (!userInfo) throw new Unauthorized()
    return userInfo
}

const signTemp = createSigner({
    algorithm: 'HS256',
    expiresIn: '15m',
    key: process.env.JWT_SECRET,
})

export const generateTempToken = (payload: Record<string, unknown>): string => {
    return signTemp(payload)
}

export const requireRoles = async (headers: Headers, roleNames: string[]): Promise<any> => {
    const userInfo = await requiredAuthenticate(headers)
    const { role } = userInfo
    if (!role) throw new HttpErr.Forbidden()
    if (!roleNames.includes(role)) throw new HttpErr.Forbidden()
    return userInfo
}
