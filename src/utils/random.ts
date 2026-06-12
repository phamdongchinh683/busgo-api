import { randomInt } from 'node:crypto'

export function generateRandomNumber(length: number) {
    let otp = ''
    for (let i = 0; i < length; i++) {
        otp += randomInt(10).toString()
    }
    return otp
}
