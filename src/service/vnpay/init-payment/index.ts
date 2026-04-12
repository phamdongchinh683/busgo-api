import { utils } from '../../../utils/index.js'
import { buildSignData, createSecureHash, hashSecret, returnUrl, tmnCode } from '../common.js'
const vnpayUrl = process.env.VNPAY_URL ?? ''

export function initiatePayment(amount: number, transactionCode: string, ip: string) {
    const vnpParams: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Amount: String(amount * 100),
        vnp_CurrCode: 'VND',
        vnp_TxnRef: transactionCode,
        vnp_OrderInfo: 'Payment for ticket',
        vnp_Locale: 'vn',
        vnp_IpAddr: ip,
        vnp_OrderType: 'other',
        vnp_CreateDate: utils.time.getNow().format('YYYYMMDDHHmmss'),
        vnp_ExpireDate: utils.time.getNow().add(10, 'minutes').format('YYYYMMDDHHmmss'),
        vnp_ReturnUrl: returnUrl,
    }

    const signData = buildSignData(vnpParams)
    const secureHash = createSecureHash(signData, hashSecret)

    return vnpayUrl + '?' + signData + `&vnp_SecureHash=${secureHash}`
}
