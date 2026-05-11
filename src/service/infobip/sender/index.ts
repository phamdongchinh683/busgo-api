import { Phone } from '../../../model/common.js'

export async function send(params: { to: Phone; message: string }) {
    const apiKey = process.env.INFOBIP_API_KEY ?? ''
    const { to, message } = params

    return fetch('https://4kkqy1.api.infobip.com/sms/3/messages', {
        method: 'POST',
        headers: {
            Authorization: `App ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            messages: [
                {
                    sender: 'BusGo',
                    destinations: [{ to: to }],
                    content: {
                        text: message,
                    },
                },
            ],
        }),
    })
}
