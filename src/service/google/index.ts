import { GoogleTokenInfo } from './type.js'
import { HttpErr } from '../../app/index.js'
import { z } from 'zod'

export async function verifyToken(params: { idToken: string }) {
    const { idToken } = params
    const configuredClientIds = (process.env.GOOGLE_CLIENT_ID ?? '')
        .split(',')
        .map(clientId => clientId.trim())
        .filter(Boolean)

    if (!configuredClientIds.length) {
        throw new HttpErr.BadRequest('Invalid Google ID token.', 'INVALID_TOKEN')
    }

    const searchParams = new URLSearchParams({ id_token: idToken })
    const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?${searchParams.toString()}`
    )
    const data = await response.json()
    const result = GoogleTokenInfo.safeParse(data)
    if (!result.success)
        throw new HttpErr.UnprocessableEntity(
            'Unable to verify Google ID token.',
            'INVALID_TOKEN',
            z.looseObject({}).parse(data)
        )

    if (!configuredClientIds.includes(result.data.aud)) {
        throw new HttpErr.Unauthorized('Invalid Google ID token.')
    }

    return result.data
}
