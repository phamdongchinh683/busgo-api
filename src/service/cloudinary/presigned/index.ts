import { createHash } from 'node:crypto'
import { utils } from '../../../utils/index.js'

const API_KEY = process.env.CLOUDINARY_API_KEY ?? ''
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? ''
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? ''

export const SIGNATURE_TTL_SECONDS = 3600

const DEFAULT_ALLOWED_FORMATS_HINT = 'jpg,jpeg,png,webp'

export function createUploadSignature(
    paramsToSign: Record<string, string>,
    apiSecret: string
): string {
    const pairs = Object.keys(paramsToSign)
        .sort()
        .map(k => `${k}=${paramsToSign[k]}`)
        .join('&')
    return createHash('sha1')
        .update(pairs + apiSecret)
        .digest('hex')
}

export function presignedUpload(
    folder: string,
    id: number | string
): {
    cloudName: string
    apiKey: string
    timestamp: string
    signature: string
    folder: string
    uploadUrl: string
    allowedFormats: string
    acceptedMimeTypes: string[]
    signatureValidSeconds: number
} {
    const timestamp = String(utils.time.getNow().unix())
    const folderPath = `${folder}/${String(id)}`

    const paramsToSign: Record<string, string> = {
        folder: folderPath,
        timestamp,
    }

    const signature = createUploadSignature(paramsToSign, API_SECRET)

    return {
        acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedFormats: DEFAULT_ALLOWED_FORMATS_HINT,
        apiKey: API_KEY,
        cloudName: CLOUD_NAME,
        folder: folderPath,
        signature,
        signatureValidSeconds: SIGNATURE_TTL_SECONDS,
        timestamp,
        uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    }
}
