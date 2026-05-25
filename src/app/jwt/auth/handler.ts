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
const verifyToken = async (headers: Headers): Promise<any | null> => {
    const { authorization, Authorization } = headers
    const authHeader = authorization ?? Authorization
    if (!authHeader) return null

    const bearer = 'Bearer '
    const token = authHeader.startsWith(bearer) ? authHeader.slice(bearer.length) : authHeader

    let payload: unknown
    try {
        payload = verify(token)
    } catch (error) {
        console.error(error)
        throw new Unauthorized('Invalid authorization header')
    }

    let userInfo: any
    try {
        userInfo = payload
    } catch (error) {
        console.error(error)
        throw new Unauthorized('Invalid token payload')
    }

    const cachedTokenVersion = await getCachedTokenVersion(userInfo.id)
    if (cachedTokenVersion !== null) {
        if (cachedTokenVersion !== userInfo.tokenVersion) {
            throw new Unauthorized('Token expired')
        }

        return userInfo
    }

    const user = await db
        .selectFrom('auth.user as u')
        .select(['u.id', 'u.tokenVersion'])
        .where('u.id', '=', userInfo.id)
        .executeTakeFirst()

    if (!user || user.tokenVersion !== userInfo.tokenVersion) {
        throw new Unauthorized('Token expired')
    }

    await setCachedTokenVersion(user.id, user.tokenVersion)

    return userInfo
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

export const requireStaffProfileRole = async (
    headers: Headers,
    roleNames: string[],
    companyRoleNames: string[]
): Promise<any> => {
    const userInfo = await requiredAuthenticate(headers)
    const { staffProfileRole, role } = userInfo
    if (!roleNames.includes(role)) throw new HttpErr.Forbidden()
    if (!companyRoleNames.includes(staffProfileRole)) throw new HttpErr.Forbidden()
    return userInfo
}
