import type { Email } from '../../../model/common.js'

const apiKey = process.env.RESEND_API_KEY ?? ''
const from = process.env.MAIL_FROM ?? ''

export async function send(params: { to: Email; subject: string; text?: string; html: string }) {
    return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `"Bus System" <${from}>`,
            to: [params.to],
            subject: params.subject,
            text: params.text,
            html: params.html,
        }),
    })
}

export async function sendMany(params: {
    to: Email[]
    subject: string
    text?: string
    html: string
}) {
    return fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `"Bus System" <${from}>`,
            to: params.to,
            subject: params.subject,
            text: params.text,
            html: params.html,
        }),
    })
}
