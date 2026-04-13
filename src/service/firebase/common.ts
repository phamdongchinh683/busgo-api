import crypto from 'node:crypto'
import { utils } from '../../utils/index.js'

const FIREBASE_MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? ''
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ?? ''

function base64url(input: object) {
    return Buffer.from(JSON.stringify(input))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
}

function normalizePrivateKey(key: string) {
    return key.replace(/\\n/g, '\n')
}

function createJwtAssertion(params: { clientEmail: string; privateKey: string }) {
    const now = Math.floor(Date.now() / 1000)

    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
        iss: params.clientEmail,
        scope: FIREBASE_MESSAGING_SCOPE,
        aud: OAUTH_TOKEN_URL,
        iat: now,
        exp: now + 60 * 60,
    }

    const unsigned = `${base64url(header)}.${base64url(payload)}`
    const signature = crypto
        .createSign('RSA-SHA256')
        .update(unsigned)
        .sign(normalizePrivateKey(params.privateKey), 'base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')

    return `${unsigned}.${signature}`
}

let cachedAccessToken: { value: string; expiresAtMs: number } | undefined

export async function getFirebaseAccessToken() {
    const now = utils.time.getNow().unix()
    if (cachedAccessToken && cachedAccessToken.expiresAtMs - 30_000 > now) {
        return cachedAccessToken.value
    }

    const assertion = createJwtAssertion({ clientEmail: CLIENT_EMAIL, privateKey: PRIVATE_KEY })

    const body = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
    })

    const res = await fetch(OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
    })

    if (!res.ok) {
        const text = await res.text()
        console.error(text)
    }

    const json = await res.json()
    cachedAccessToken = {
        value: json.access_token,
        expiresAtMs: now + json.expires_in * 1000,
    }
    return cachedAccessToken.value
}
