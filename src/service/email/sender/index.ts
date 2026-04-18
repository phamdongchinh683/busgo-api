import type { Email } from '../../../model/common.js'

export async function send(params: {
    from: Email
    to: Email
    subject: string
    text: string
    html: string
}) {
    const apiKey = process.env.RESEND_API_KEY ?? ''

    return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `"Bus System" <${params.from}>`,
            to: [params.to],
            subject: params.subject,
            text: params.text,
            html: params.html,
        }),
    })
}
