import { Phone } from '../../../model/common.js'

const ESMS_SEND_MESSAGE_URL = 'https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get'

type EsmsResponse = {
    CodeResult?: string
}

export async function send(params: { to: Phone; message: string }): Promise<void> {
    const query = new URLSearchParams({
        ApiKey: process.env.ESMS_API_KEY ?? '',
        SecretKey: process.env.ESMS_SECRET_KEY ?? '',
        Content: params.message,
        Phone: params.to,
        SmsType: '8',
        IsUnicode: '1',
    })

    const response = await fetch(`${ESMS_SEND_MESSAGE_URL}?${query}`)
    const result = (await response.json()) as EsmsResponse

    if (!response.ok || result.CodeResult !== '100') {
        throw new Error('Không thể gửi mã OTP.')
    }
}
