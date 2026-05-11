import z from 'zod'

import { HttpErr } from '../../app/index.js'

import { FacebookDebugTokenResp, FacebookGetMeResp } from './type.js'

const ACCOUNT_ID = process.env.FACEBOOK_APP_ID ?? ''
const SECRET = process.env.FACEBOOK_APP_SECRET ?? ''
const ACCESS_TOKEN = `${ACCOUNT_ID}|${SECRET}`

export async function verifyToken(p: { token: string }) {
    const { data } = await debugToken(p)
    if (data.app_id !== ACCOUNT_ID)
        throw new HttpErr.UnprocessableEntity(
            'Invalid token, wrong app id',
            'VERIFY_CODE_INVALID',
            data
        )
    if (data.expires_at * 1000 < Date.now())
        throw new HttpErr.UnprocessableEntity(
            'Invalid token, token expired',
            'VERIFY_CODE_INVALID',
            data
        )
    if (!data.is_valid)
        throw new HttpErr.UnprocessableEntity('Invalid token', 'VERIFY_CODE_INVALID', data)

    const info = await getMe(p)
    return info
}

async function debugToken(p: { token: string }): Promise<FacebookDebugTokenResp> {
    const searchParams = new URLSearchParams({
        access_token: ACCESS_TOKEN,
        input_token: p.token,
    })
    const baseUrl = 'https://graph.facebook.com/v24.0/debug_token'
    const url = `${baseUrl}?${searchParams.toString()}`
    const response = await fetch(url)
    const data = await response.json()
    const result = FacebookDebugTokenResp.safeParse(data)
    if (!result.success)
        throw new HttpErr.UnprocessableEntity(
            'Failed to call facebook debug_token',
            'FACEBOOK_LOGIN_FAIL',
            z.looseObject({}).parse(data)
        )
    return result.data
}

async function getMe(p: { token: string }): Promise<FacebookGetMeResp> {
    const searchParams = new URLSearchParams({
        access_token: p.token,
        fields: 'id,first_name,last_name,email',
    })
    const url = `https://graph.facebook.com/v24.0/me?${searchParams.toString()}`
    const response = await fetch(url)
    const data = await response.json()
    const result = FacebookGetMeResp.safeParse(data)
    if (!result.success)
        throw new HttpErr.UnprocessableEntity(
            'Failed to call facebook /me',
            'FACEBOOK_LOGIN_FAIL',
            z.looseObject({}).parse(data)
        )
    return result.data
}
