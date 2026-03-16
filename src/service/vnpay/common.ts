import crypto from 'node:crypto'

export const hashSecret = process.env.VNPAY_SECRET ?? ''
export const tmnCode = process.env.VNPAY_TMN_CODE ?? ''
export const returnUrl = process.env.VNPAY_RETURN_URL ?? ''

const encodeParam = (value: string) => encodeURIComponent(value).replace(/%20/g, '+')

export const normalizeQueryValue = (value: string | string[] | undefined) => {
    if (Array.isArray(value)) {
        return value[0] ?? ''
    }
    return value ?? ''
}

const sortParams = (params: Record<string, string>) =>
    Object.keys(params)
        .sort()
        .reduce(
            (acc, key) => {
                acc[key] = params[key]
                return acc
            },
            {} as Record<string, string>
        )

export const buildSignData = (params: Record<string, string>) => {
    const sortedParams = sortParams(params)
    return Object.keys(sortedParams)
        .map(key => `${encodeParam(key)}=${encodeParam(sortedParams[key])}`)
        .join('&')
}

export const createSecureHash = (signData: string, secret: string) =>
    crypto.createHmac('sha512', secret).update(signData).digest('hex')

export const buildVnpSignData = (params: Record<string, string>, fields: string[]) => {
    return fields.map(field => params[field] ?? '').join('|')
}
