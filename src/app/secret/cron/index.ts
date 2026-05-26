import { HttpErr } from '../../index.js'
import 'dotenv/config'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export function verifyCronSecret(secret: string) {
    if (secret !== CRON_SECRET) {
        throw new HttpErr.Forbidden('Mã bí mật cron không hợp lệ.')
    }
    return true
}
