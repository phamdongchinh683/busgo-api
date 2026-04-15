import { buildSignData, createSecureHash, hashSecret, normalizeQueryValue } from '../common.js'
const vnpayUrl = process.env.VNPAY_URL ?? ''

export function verifyIpn(query: Record<string, string>) {
    const rawQuery = query as Record<string, string>
    const vnpParams: Record<string, string> = {}

    for (const [key, value] of Object.entries(rawQuery)) {
        vnpParams[key] = normalizeQueryValue(value)
    }

    const secureHash = vnpParams.vnp_SecureHash ?? ''
    delete vnpParams.vnp_SecureHash
    delete vnpParams.vnp_SecureHashType

    const signData = buildSignData(vnpParams)
    const signed = createSecureHash(signData, hashSecret)

    if (secureHash !== signed) {
        return { RspCode: '97', Message: 'Invalid checksum' }
    }

    return vnpParams
}
